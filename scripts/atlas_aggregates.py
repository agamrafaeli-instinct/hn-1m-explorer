#!/usr/bin/env python3
"""Precomputed aggregates over the whole archive (Atlas slice 7a, #121). Small static files for charts and ranges.

Writes data/atlas/:
  months.json        one row per month, 2006 to the last archived month: counts by type (data/history/daily.csv) and stories held. Small, loads first.
  tops-<year>.json   per month: top 20 domains by story count, top 30 stories by score.
  terms-<char>.json  terms grouped by first character (a-z, 0-9, _): for each term, the number of stories whose title holds it, by month, for the top TERMS terms of the whole archive. One lookup loads one file.
  index.json         file list with source, date range and bytes.
Source of stories: data/archive/stories-*.parquet. Counts by type: data/history/daily.csv. No author lists: the archive holds no author names.
"""
import csv, datetime as dt, json, os, pathlib, re, sys
import duckdb
R = pathlib.Path(__file__).resolve().parents[1]
TERMS = 20000
STOP = set('a an and are as at be but by for from has have how i in is it its my not of on or our so than that the their this to was we what when why with you your'.split())


def build(root=R, out=None, terms=TERMS):
    root = pathlib.Path(root); out = pathlib.Path(out or root / 'data/atlas'); out.mkdir(parents=True, exist_ok=True)
    db = duckdb.connect()
    db.execute("SET memory_limit='1GB'"); db.execute('SET threads=2'); db.execute("SET temp_directory='/tmp/duck_tmp'")
    db.execute("CREATE TABLE s AS SELECT id, time AT TIME ZONE 'UTC' AS t, title, url, score, descendants FROM read_parquet(?)", [str(root / 'data/archive/stories-*.parquet')])
    db.execute("CREATE TABLE s2 AS SELECT *, strftime(t, '%Y-%m') AS m, regexp_extract(lower(coalesce(url,'')), '^https?://(?:www\\.)?([^/:?#]+)', 1) AS dom FROM s")
    lo, hi = db.execute('SELECT strftime(min(t), \'%Y-%m\'), strftime(max(t), \'%Y-%m\') FROM s2').fetchone()
    months = {}
    with open(root / 'data/history/daily.csv', newline='') as f:
        for r in csv.DictReader(f):
            m = months.setdefault(r['date'][:7], {'month': r['date'][:7], 'stories': 0, 'comments': 0, 'jobs': 0, 'polls': 0})
            for k in ('stories', 'comments', 'jobs', 'polls'): m[k] += int(r[k] or 0)
    for m, n in db.execute('SELECT m, count(*) FROM s2 GROUP BY 1').fetchall():
        months.setdefault(m, {'month': m, 'stories': 0, 'comments': 0, 'jobs': 0, 'polls': 0})['stories_held'] = n
    for m, rows in _groups(db.execute("SELECT m, dom, c FROM (SELECT m, dom, c, row_number() OVER (PARTITION BY m ORDER BY c DESC, dom) rn FROM (SELECT m, dom, count(*) c FROM s2 WHERE dom<>'' GROUP BY 1,2)) WHERE rn<=20 ORDER BY m, c DESC").fetchall()):
        months[m]['top_domains'] = [[d, c] for d, c in rows]
    for m, rows in _groups(db.execute("SELECT m, id, title, score, coalesce(url,'') FROM s2 WHERE score IS NOT NULL QUALIFY row_number() OVER (PARTITION BY m ORDER BY score DESC, id)<=30 ORDER BY m, score DESC").fetchall()):
        months[m]['top_stories'] = [[i, t, sc, u] for i, t, sc, u in rows]
    doc = {'source': 'data/archive/stories-*.parquet (stories) and data/history/daily.csv (counts by type)', 'range': [lo, hi],
           'note': 'Scores in the archive were saved at fetch time and are low for 2025 and 2026; use ratios. Comments are counted, not archived.',
           'months': [months[k] for k in sorted(months)]}
    files = []
    tops = {}
    for mm in doc['months']:
        t = {k: mm.pop(k) for k in ('top_domains', 'top_stories') if k in mm}
        if t: tops.setdefault(mm['month'][:4], {})[mm['month']] = t
    doc['tops'] = 'tops-<year>.json, one file per year, loaded only when a chart needs them'
    _write(out / 'months.json', doc, files)
    for y in sorted(tops):
        _write(out / ('tops-%s.json' % y), {'year': int(y), 'source': 'story titles and urls in data/archive', 'range': [min(tops[y]), max(tops[y])], 'months': tops[y]}, files)
    words = "regexp_extract_all(lower(title), '[a-z][a-z0-9+#.-]{1,24}')"
    db.execute('CREATE TABLE w (m VARCHAR, w VARCHAR, c INTEGER)')
    for (y,) in db.execute('SELECT DISTINCT substr(m,1,4) FROM s2 ORDER BY 1').fetchall():  # one year at a time keeps memory small
        db.execute("INSERT INTO w SELECT m, w, count(DISTINCT id) FROM (SELECT m, id, unnest(%s) w FROM s2 WHERE title IS NOT NULL AND m LIKE '%s-%%') GROUP BY 1,2" % (words, y))
    stop = ','.join("'%s'" % x for x in STOP)
    top = [r[0] for r in db.execute("SELECT w FROM w WHERE w NOT IN (%s) GROUP BY w ORDER BY sum(c) DESC, w LIMIT %d" % (stop, terms)).fetchall()]
    db.execute('CREATE TABLE top AS SELECT unnest(?) AS w', [top])
    by_bucket = {}
    for m, wd, c in db.execute('SELECT m, w.w, c FROM w JOIN top ON w.w=top.w ORDER BY w.w, m').fetchall():
        by_bucket.setdefault(_bucket(wd), {}).setdefault(wd, {})[m] = c
    for b in sorted(by_bucket):
        ms = [m for t in by_bucket[b].values() for m in t]
        _write(out / ('terms-%s.json' % b), {'bucket': b, 'source': 'story titles in data/archive', 'range': [min(ms), max(ms)], 'terms': by_bucket[b]}, files)
    idx = {'built_from': 'scripts/atlas_aggregates.py', 'range': [lo, hi], 'terms_kept': len(top), 'files': files,
           'total_bytes': sum(f['bytes'] for f in files)}
    (out / 'index.json').write_text(json.dumps(idx, indent=1) + '\n')
    return idx


def _bucket(w):
    return w[0] if w[0].isalnum() and w[0].isascii() else '_'


def _groups(rows):
    cur = None; acc = []
    for r in rows:
        if r[0] != cur:
            if cur is not None: yield cur, acc
            cur, acc = r[0], []
        acc.append(r[1:])
    if cur is not None: yield cur, acc


def _write(p, obj, files):
    p.write_text(json.dumps(obj, separators=(',', ':'), ensure_ascii=False))
    files.append({'name': p.name, 'bytes': p.stat().st_size})


if __name__ == '__main__':
    i = build(); print(i['range'], i['terms_kept'], 'terms', i['total_bytes'], 'bytes in', len(i['files']), 'files')
