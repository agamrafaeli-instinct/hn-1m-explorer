#!/usr/bin/env python3
"""Story finder, step 2 (#177): dictionary builder and n-gram bursts.
A term is not a plain word. Before a story is published, its term becomes a dictionary: the regex, the aliases that matched
(with counts), exclusions, 20 sample matches and 20 near misses (titles that contain an alias as text but do not match). A person can
read the samples and see what the regex catches and misses. Title matching only, as in scripts/film.py.

  python3 scripts/finder_dictionary.py term <film term id> ...   -> data/finder/dictionaries/<id>.json (uses TERMS from film.py)
  python3 scripts/finder_dictionary.py bursts                   -> data/finder/bursts.json: new candidate terms from title word and two-word bursts
Needs duckdb and data/archive (the daily workflow has both). The pure functions below are tested without them.
"""
import collections, hashlib, json, os, re, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SAMPLE, MIN_N, BURST_RATIO = 20, 30, 3.0
STOP = set('a an and are as at be by for from has have how in is it its new of on or the to was we what why will with you your i my not no do can this that vs via'.split())

def _key(t): return hashlib.md5(t.encode('utf-8')).hexdigest()

def build(term, label, pattern, titles, exclusions=()):
    """titles: iterable of title strings. Returns the dictionary record. Same input, same output (samples are picked by hash order)."""
    rx = re.compile(pattern); ex = [re.compile(e) for e in exclusions]
    aliases = collections.Counter(); matches, rest = [], []
    for t in titles:
        low = t.lower(); m = rx.search(low)
        if m and not any(e.search(low) for e in ex): aliases[m.group(0).strip()] += 1; matches.append(t)
        else: rest.append(t)
    near = []
    keys = [a for a, _ in aliases.most_common(5) if len(a) >= 3]
    for t in rest:
        low = t.lower()
        if any(k in low for k in keys): near.append(t)
    pick = lambda xs: sorted(set(xs), key=_key)[:SAMPLE]
    return {'schema': 1, 'term': term, 'label': label, 'pattern': pattern, 'exclusions': list(exclusions),
            'matches': len(matches), 'aliases': [{'text': a, 'count': c} for a, c in aliases.most_common(30)],
            'sample_matches': pick(matches), 'sample_near_misses': pick(near), 'near_misses_total': len(near),
            'note': 'Title matching only. The samples are chosen by hash order, not by hand. Read them before trusting the term.'}

def burst_terms(rows, min_n=MIN_N, ratio=BURST_RATIO):
    """rows: (term, n_latest, n_prior). Share is per window total, passed as tuple (term, n_latest, n_prior, total_latest, total_prior)."""
    out = []
    for term, nl, npr, tl, tp in rows:
        if nl < min_n: continue
        sl = nl / tl; sp = (npr / tp) if tp else 0
        r = (sl / sp) if sp else None
        if sp == 0 or sl / sp >= ratio: out.append({'term': term, 'n_latest': nl, 'n_prior': npr, 'share_latest': sl, 'share_prior': sp, 'ratio': r})
    return sorted(out, key=lambda x: (-(x['ratio'] or 1e9), x['term']))

def _con():
    import duckdb, glob
    con = duckdb.connect(); files = sorted(glob.glob(os.path.join(ROOT, 'data/archive/stories-*.parquet')))
    con.execute("create view s as select * from read_parquet(%s) where title is not null" % json.dumps(files)); return con

def cmd_term(ids):
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import film
    con = _con(); os.makedirs(os.path.join(ROOT, 'data/finder/dictionaries'), exist_ok=True)
    for k in ids:
        label, pat = film.TERMS[k]
        titles = [r[0] for r in con.execute("select title from s where regexp_matches(lower(title), ?)", [pat]).fetchall()]
        d = build(k, label, pat, titles)
        key = d['aliases'][0]['text'] if d['aliases'] else label.lower()
        near = [r[0] for r in con.execute("select title from s where lower(title) like ? and not regexp_matches(lower(title), ?) limit 5000", ['%' + key + '%', pat]).fetchall()]
        d['sample_near_misses'] = sorted(set(near), key=_key)[:SAMPLE]; d['near_misses_total'] = len(near)
        json.dump(d, open(os.path.join(ROOT, 'data/finder/dictionaries/%s.json' % k), 'w'), indent=1, sort_keys=True); print(k, d['matches'], 'matches', len(d['aliases']), 'aliases')

def cmd_bursts():
    """Latest year against the 3 years before it, one year at a time so memory stays small (the first version scanned all 20 years at once and stalled)."""
    con = _con(); con.execute("set memory_limit='1500MB'; set threads=2")
    mx = con.execute("select max(time at time zone 'UTC') from s").fetchone()[0]
    ng = """select unnest(list_distinct(list_concat(ws, [ws[i] || ' ' || ws[i+1] for i in range(1, len(ws)) if length(ws[i]) >= 3 and length(ws[i+1]) >= 3]))) as term
            from (select list_filter(string_split(trim(regexp_replace(lower(regexp_replace(title, '[^A-Za-z0-9+#. -]', ' ', 'g')), ' +', ' ', 'g')), ' '), x -> length(x) >= 3) as ws from s where time at time zone 'UTC' >= ?::timestamp and time at time zone 'UTC' < ?::timestamp)"""
    def span(lo, hi): return con.execute("select count(*) from s where time at time zone 'UTC' >= ?::timestamp and time at time zone 'UTC' < ?::timestamp", [lo, hi]).fetchone()[0]
    end = mx + __import__('datetime').timedelta(seconds=1); start = end - __import__('datetime').timedelta(days=365); pstart = start - __import__('datetime').timedelta(days=3 * 365)
    con.execute("create table cur as select term, count(*) n from (%s) group by term having count(*) >= %d" % (ng, MIN_N), [str(start), str(end)])
    tl = span(start, end); tp = span(pstart, start); prior = collections.Counter()
    for i in range(3):
        lo = pstart + __import__('datetime').timedelta(days=365 * i); hi = lo + __import__('datetime').timedelta(days=365)
        for t, n in con.execute("select term, count(*) from (%s) where term in (select term from cur) group by term" % ng, [str(lo), str(hi)]).fetchall(): prior[t] += n
    rows = [(t, n, prior.get(t, 0), tl, tp) for t, n in con.execute("select term, n from cur").fetchall() if t.split(' ')[0] not in STOP and t.split(' ')[-1] not in STOP]
    res = burst_terms(rows)[:200]
    json.dump({'schema': 1, 'latest_from': str(start)[:10], 'latest_to': str(mx)[:10], 'rule': 'term in at least %d titles of the latest year and a latest share at least %gx its share over the 3 years before (or never seen before)' % (MIN_N, BURST_RATIO), 'terms': res}, open(os.path.join(ROOT, 'data/finder/bursts.json'), 'w'), indent=1, sort_keys=True)
    print(len(res), 'burst terms')

if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['term']: cmd_term(a[1:])
    elif a[:1] == ['bursts']: cmd_bursts()
    else: print(__doc__)
