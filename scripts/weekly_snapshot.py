#!/usr/bin/env python3
"""Save one snapshot per complete Monday-start UTC week to data/weekly/YYYY-Www.json.

Why: only a rolling window of the newest items is kept (about 10 weeks), so a week that is not saved is lost for good.
Rules:
  * Only complete weeks that lie inside the archive window are saved (same rule as scripts/terms.py).
  * A saved week is never overwritten. The file is created exclusively; if it exists the week is skipped.
  * Story numbers exclude dead and deleted items and count a missing score or comment count as 0 (same as terms.py, geeks.py).
  * Baskets come from the repo's existing definitions, so nothing is defined twice:
    scripts/terms.py BASKETS, scripts/geeks.py BASKETS, docs/curious-round2-plan.json tests.
Modes:
  (default)    weekly job: kind "weekly".
  --backfill   one-off build of weeks that were not saved when they happened: kind "backfill", with a note saying so.
  --replace-backfill  with --backfill: replace an existing backfill file that has an older schema. Never touches kind "weekly".
Usage: python scripts/weekly_snapshot.py [--root DIR] [--backfill] [--week 2026-W31]
"""
import argparse, ast, collections, csv, datetime as dt, json, os, pathlib, re, sys
csv.field_size_limit(10**9)
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import weekly_lists as L
SCHEMA = 2  # v2 adds shared, engineers, vcs, geeks blocks (docs/WEEKLY_SPEC.md). v1 fields are unchanged.
DAY = 86400
# Which baskets each audience tracks. One place to change (see docs/WEEKLY_SPEC.md).
AUDIENCES = {
    'engineers': ['newsys', 'showhn', 'askhn'],
    'vcs': ['deeptech'],
    'geeks': ['weird', 'science', 'retro', 'history', 'puzzle', 'boring'],  # plus every round 2 topic, added below
}
TOP_STORIES = 10; TOP_DOMAINS = 15; BASKET_STORIES = 3; BASKET_DOMAINS = 5
DOMAIN_MIN_STORIES = 3  # every domain with at least this many stories is kept in `domains` (needed to tell what is new next week)

def geeks_baskets(root):
    """Read BASKETS out of scripts/geeks.py without running that script."""
    tree = ast.parse((root / 'scripts/geeks.py').read_text())
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(getattr(t, 'id', '') == 'BASKETS' for t in node.targets):
            return ast.literal_eval(node.value)
    raise ValueError('BASKETS not found in scripts/geeks.py')

def load_baskets(root):
    import terms
    baskets = {}  # name -> (audience, pattern)
    def add(name, pattern, audience):
        if name in baskets and baskets[name][1] != pattern: raise ValueError('Basket name reused with a different pattern: ' + name)
        baskets.setdefault(name, (audience, pattern))
    for name, pattern in terms.BASKETS.items(): add(name, pattern, next((a for a, ns in AUDIENCES.items() if name in ns), 'geeks'))
    for name, pattern in geeks_baskets(root).items(): add(name, pattern, next((a for a, ns in AUDIENCES.items() if name in ns), 'geeks'))
    plan = json.loads((root / 'docs/curious-round2-plan.json').read_text())
    for t in plan['tests']: add(t['key'], t['pattern'], 'geeks')
    return {k: (a, re.compile(p, re.I)) for k, (a, p) in baskets.items()}

def iso_label(start_date):
    y, w, _ = start_date.isocalendar(); return f'{y}-W{w:02d}'

def week_start(t):
    d = dt.datetime.fromtimestamp(t, dt.timezone.utc).date(); return d - dt.timedelta(days=d.weekday())

def ts(d): return int(dt.datetime.combine(d, dt.time(), dt.timezone.utc).timestamp())

def read_archive(root):
    """Yield rows from the manifest-listed chunks only."""
    manifest = json.loads((root / 'data/manifest.json').read_text())
    seen = set()
    for chunk in manifest['chunks']:
        with (root / chunk['path']).open(newline='', encoding='utf-8') as fh:
            for r in csv.DictReader(fh):
                if r['id'] in seen: raise ValueError('Duplicate manifest item ' + r['id'])
                seen.add(r['id']); yield r
    if len(seen) != manifest['total_rows']: raise ValueError('Manifest row count mismatch')


TOKEN = re.compile(r'[a-z0-9_]+')

class Matcher:
    """Whole-word and phrase matching for groups of named terms, using the lists in weekly_lists.py."""
    def __init__(self, groups):
        self.index = collections.defaultdict(list); self.phrases = []
        for name, t in groups.items():
            for w in t['words']: self.index[w].append(name)
            for ph in t['phrases']:
                self.phrases.append((name, ph, re.compile(r'(?<![a-z0-9_])' + re.escape(ph) + r'(?![a-z0-9_])')))
        self.keys = set(self.index)
    def hits(self, low, tokens):
        out = set()
        for w in tokens & self.keys: out.update(self.index[w])
        for name, ph, rx in self.phrases:
            if name not in out and ph in low and rx.search(low): out.add(name)
        return out

def words(text):
    low = text.lower(); return low, set(TOKEN.findall(low))

class Lists:
    def __init__(self):
        self.baseline = Matcher(L.BASELINE); self.core = Matcher({'core': L.AI_CORE})
        self.langs = Matcher(L.LANGUAGES); self.tools = Matcher(L.TOOLS); self.aicode = Matcher(L.AI_CODING)
        self.themes = Matcher(L.THEMES); self.infra = Matcher({'infra': L.AI_INFRA}); self.deals = Matcher(L.DEAL_WORDS)
        self.skills = Matcher(L.HIRING_SKILLS)
        self.watch = [(n, re.compile(r'\b' + re.escape(n) + r'\b', 0 if n in L.CASE_SENSITIVE else re.I)) for n in L.WATCHLIST]
        self.press = set(L.PRESS); self.primary = set(L.PRIMARY); self.reading = {d: k for k, ds in L.READING.items() for d in ds}
        self.hiring_head = re.compile(r'^[^<\n]{3,160}\|[^<\n]{2,160}\|')
        self.yeartag = re.compile(r'\((19|20)\d\d\)\s*$')

def new_bucket():
    return {'stories': [], 'counts': collections.Counter(), 'm': collections.Counter(), 'authors': set()}

def tally_story(b, ls, r, live, row_id):
    """Count term mentions for one story item. live = not dead, not deleted. Returns the is_ai flag (live only)."""
    title = r['title'] or ''; text = r['text'] or ''
    low, tk = words(title + ' ' + text); m = b['m']
    m['stories_all'] += 1
    base = ls.baseline.hits(low, tk); core = ls.core.hits(low, tk)
    for n in base: m['base.' + n + '.story_all'] += 1
    if core: m['base.core.story_all'] += 1
    if not live: return False
    m['stories_live'] += 1
    for n in base: m['base.' + n + '.story_live'] += 1
    if core: m['base.core.story_live'] += 1
    for n in ls.langs.hits(low, tk): m['lang.' + n + '.stories'] += 1
    for n in ls.tools.hits(low, tk): m['tool.' + n + '.stories'] += 1
    for n in ls.aicode.hits(low, tk): m['aicode.' + n + '.stories'] += 1
    if ls.infra.hits(low, tk): m['infra.stories'] += 1
    tlow, ttk = words(title)
    for n in ls.themes.hits(tlow, ttk): m['theme.' + n + '.stories'] += 1
    return bool(core)

def tally_comment(b, ls, r, live):
    text = r['text'] or ''; m = b['m']; m['comments_all'] += 1
    low, tk = words(text)
    base = ls.baseline.hits(low, tk); core = ls.core.hits(low, tk)
    for n in base: m['base.' + n + '.comment_all'] += 1
    if core: m['base.core.comment_all'] += 1
    if not live: return
    m['comments_live'] += 1
    for n in base: m['base.' + n + '.comment_live'] += 1
    if core: m['base.core.comment_live'] += 1
    for n in ls.langs.hits(low, tk): m['lang.' + n + '.comments'] += 1
    for n in ls.tools.hits(low, tk): m['tool.' + n + '.comments'] += 1
    for n in ls.aicode.hits(low, tk): m['aicode.' + n + '.comments'] += 1
    if ls.infra.hits(low, tk): m['infra.comments'] += 1
    first = text.split('<p>')[0]
    if ls.hiring_head.match(first) and first.count('|') >= 2:
        m['hiring.posts'] += 1
        for n in ls.skills.hits(low, tk): m['hiring.' + n] += 1

def agg(stories):
    return {'stories': len(stories), 'points': sum(s[1] for s in stories), 'comments': sum(s[2] for s in stories), 'hit10': sum(1 for s in stories if s[1] >= 10)}

def story_row(s):  # s = (id, score, comments, domain, title, time)
    return {'id': s[0], 'points': s[1], 'comments': s[2], 'domain': s[3], 'title': s[4]}

def top_stories(stories, n):
    return [story_row(s) for s in sorted(stories, key=lambda s: (-s[1], -s[2], s[0]))[:n]]

def top_domains(stories, n):
    c = collections.defaultdict(lambda: [0, 0])
    for s in stories:
        if s[3]: c[s[3]][0] += 1; c[s[3]][1] += s[1]
    return [{'domain': d, 'stories': v[0], 'points': v[1]} for d, v in sorted(c.items(), key=lambda kv: (-kv[1][0], -kv[1][1], kv[0]))[:n]]

def all_domains(stories, minimum):
    c = collections.defaultdict(lambda: [0, 0])
    for s in stories:
        if s[3]: c[s[3]][0] += 1; c[s[3]][1] += s[1]
    return {d: v for d, v in sorted(c.items()) if v[0] >= minimum}

def grp(m, prefix, names, keys):
    """Collect m['<prefix>.<name>.<key>'] counters into {name: {key: n}}."""
    return {n: {k: m.get(f'{prefix}.{n}.{k}', 0) for k in keys} for n in names}

def v2_blocks(stories, m, authors, counts):
    live = stories
    by_comments = lambda rows, n: [story_row(x) for x in sorted(rows, key=lambda x: (-x[2], -x[1], x[0]))[:n]]
    base_names = ['core'] + list(L.BASELINE)
    basis = ('story_live', 'story_all', 'comment_live', 'comment_all')
    debated = [x for x in live if x[2] >= 100 and x[2] > x[1]]
    show = [x for x in live if x[4] and x[4].lower().startswith('show hn')]
    ask = [x for x in live if x[4] and x[4].lower().startswith('ask hn')]
    linked = [x for x in live if x[3]]
    dom = collections.Counter(x[3] for x in linked)
    def deals():
        hits = [x for x in live if x[4] and _deal_rx(x[4])]
        return hits
    out = {}
    out['shared'] = {
        'volume': {'stories_live': m.get('stories_live', 0), 'stories_all': m.get('stories_all', 0),
                   'comments_live': m.get('comments_live', 0), 'comments_all': m.get('comments_all', 0), 'distinct_authors': len(authors),
                   'comments_dead_or_deleted': m.get('comments_all', 0) - m.get('comments_live', 0)},
        'ai': {'note': 'Whole-word matches. Stories: title plus text. Comments: text. Dead and deleted items keep no title or text in the archive, so a term count is the same on the live and all bases. Only the denominator differs (stories_live vs stories_all). data/history/terms_daily.csv divides by all items.',
               'terms': grp(m, 'base', base_names, basis)},
        'discussion': {'stories_100_comments': sum(1 for x in live if x[2] >= 100), 'stories_100_points': sum(1 for x in live if x[1] >= 100),
                       'debated': by_comments(debated, 10), 'most_commented': by_comments(live, 10),
                       'note': 'debated = 100 or more comments and more comments than points. Counts are first readings.'}}
    out['engineers'] = {
        'languages': grp(m, 'lang', L.LANGUAGES, ('stories', 'comments')), 'tools': grp(m, 'tool', L.TOOLS, ('stories', 'comments')),
        'ai_coding': grp(m, 'aicode', L.AI_CODING, ('stories', 'comments')),
        'show_hn': {'stories': len(show), 'hit10': sum(1 for x in show if x[1] >= 10), 'github': sum(1 for x in show if x[3] == 'github.com'), 'top': top_stories(show, 5)},
        'ask_hn': {'stories': len(ask), 'top_by_comments': by_comments(ask, 5)},
        'hiring': {'estimated_posts': m.get('hiring.posts', 0), 'skills': {n: m.get(f'hiring.{n}', 0) for n in L.HIRING_SKILLS},
                   'job_items': counts.get('job', 0),
                   'note': 'Estimate. A comment counts when its first line has two or more "|" separated fields. Not linked to a thread; the monthly thread can span two weeks.'}}
    out['vcs'] = {
        'themes': grp(m, 'theme', L.THEMES, ('stories',)), 'ai_infra': {'stories': m.get('infra.stories', 0), 'comments': m.get('infra.comments', 0)},
        'sources': {'press': agg([x for x in live if x[3] in PRESS_SET]), 'primary': agg([x for x in live if x[3] in PRIMARY_SET]), 'linked_stories': len(linked)},
        'watchlist': {'note': 'Starter list from scripts/weekly_lists.py, to be replaced by an owner-chosen list. Mentions in story titles.',
                      'mentions': {n: sum(1 for x in live if x[4] and rx.search(x[4])) for n, rx in _WATCH}},
        'deal_words': _deal_block(live)}
    ai_free = [x for x in live if not x[7]]
    out['geeks'] = {
        'ai_free': {'stories': len(ai_free), 'top': top_stories(ai_free, 5)},
        'old_year_tag': {'stories': sum(1 for x in live if x[4] and _YEAR.search(x[4]))},
        'variety': {'linked_stories': len(linked), 'distinct_domains': len(dom), 'top10_domain_stories': sum(n for _, n in dom.most_common(10))},
        'reading': {k: sum(1 for x in live if _READ.get(x[3]) == k) for k in L.READING},
        'debated_non_ai': by_comments([x for x in debated if not x[7]], 5)}
    return out

PRESS_SET = set(L.PRESS); PRIMARY_SET = set(L.PRIMARY); _READ = {d: k for k, ds in L.READING.items() for d in ds}
_YEAR = re.compile(r'\((19|20)\d\d\)\s*$')
_WATCH = [(n, re.compile(r'\b' + re.escape(n) + r'\b', 0 if n in L.CASE_SENSITIVE else re.I)) for n in L.WATCHLIST]
_DEAL = Matcher(L.DEAL_WORDS)
def _deal_rx(title):
    low, tk = words(title); return _DEAL.hits(low, tk)
def _deal_block(live):
    per = collections.Counter(); hits = []
    for x in live:
        if not x[4]: continue
        h = _deal_rx(x[4])
        if h:
            hits.append(x)
            for n in h: per[n] += 1
    return {'stories': len(hits), 'by_word': {n: per.get(n, 0) for n in L.DEAL_WORDS}, 'top': top_stories(hits, 5),
            'note': 'Titles that talk about deals. HN talking, not a deal database.'}

def snapshot(start, bucket, baskets, meta):
    stories = bucket['stories']
    tagged = [(s, {k for k, (_, rx) in baskets.items() if s[4] and rx.search(s[4])}) for s in stories]
    out = {'schema_version': SCHEMA, 'week': iso_label(start), 'start_utc': start.isoformat(),
           'end_exclusive_utc': (start + dt.timedelta(days=7)).isoformat(), **meta,
           'items': dict(bucket['counts']), 'stories': agg(stories),
           'stories_missing_score': sum(1 for s in stories if s[6]),
           'top_stories': top_stories(stories, TOP_STORIES), 'top_domains': top_domains(stories, TOP_DOMAINS),
           'domains': all_domains(stories, DOMAIN_MIN_STORIES), 'baskets': {}}
    for name in sorted(baskets):
        hits = [s for s, tags in tagged if name in tags]
        out['baskets'][name] = {'audience': baskets[name][0], **agg(hits),
                                'top_stories': top_stories(hits, BASKET_STORIES), 'top_domains': top_domains(hits, BASKET_DOMAINS)}
    out.update(v2_blocks(stories, bucket['m'], bucket['authors'], bucket['counts']))
    return out

def build(root, wanted=None, backfill=False, now=None):
    """Return {week_label: snapshot} for complete weeks in the archive that pass `wanted(label)`."""
    root = pathlib.Path(root); baskets = load_baskets(root); ls = Lists()
    manifest = json.loads((root / 'data/manifest.json').read_text())
    lo = hi = None
    bucket = collections.defaultdict(new_bucket)
    for r in read_archive(root):
        if not r['time']: continue
        t = int(r['time']); lo = t if lo is None or t < lo else lo; hi = t if hi is None or t > hi else hi
        b = bucket[week_start(t)]; typ = r['type'] or 'other'
        b['counts']['total'] += 1; b['counts'][typ if typ in ('story', 'comment', 'job') else 'other'] += 1
        if r['by']: b['authors'].add(r['by'])
        dead = r['dead'] == '1'; deleted = r['deleted'] == '1'
        if dead: b['counts']['dead'] += 1
        if deleted: b['counts']['deleted'] += 1
        live = not dead and not deleted
        if typ == 'comment': tally_comment(b, ls, r, live); continue
        if typ != 'story': continue
        is_ai = tally_story(b, ls, r, live, r['id'])
        if not live: continue
        no_score = r['score'] == ''
        b['stories'].append((int(r['id']), int(r['score'] or 0), int(r['descendants'] or 0), r['domain'], r['title'], t, no_score, is_ai))
    now = now or dt.datetime.now(dt.timezone.utc)
    meta_base = {'kind': 'backfill' if backfill else 'weekly', 'saved_at': now.strftime('%Y-%m-%dT%H:%M:%SZ'),
                 'methods': {'list_version': L.LIST_VERSION, 'lists': 'scripts/weekly_lists.py', 'spec': 'docs/WEEKLY_SPEC.md'},
                 'archive': {'min_time': lo, 'max_time': hi, 'manifest_generated_at': manifest['generated_at'], 'manifest_rows': manifest['total_rows'],
                             'score_policy': manifest.get('daily_update', {}).get('score_policy', 'snapshot at collection')}}
    if backfill:
        meta_base['backfill_note'] = ('Built after the week ended from the archive CSVs, not saved at the time. Same method and fields as a weekly save. '
                                      'Scores and comment counts are as first retrieved, same as every week.')
    out = {}
    for start in sorted(bucket):
        if ts(start) < lo or ts(start) + 7 * DAY - 1 > hi: continue  # incomplete week
        label = iso_label(start)
        if wanted and not wanted(label): continue
        out[label] = snapshot(start, bucket[start], baskets, meta_base)
    return out

def save(root, snaps, replace_backfill=False):
    """Create each file exclusively. Returns (saved, skipped). With replace_backfill, an existing file is replaced only when it
    is kind "backfill", has an older schema, and the new snapshot is also a backfill. A kind "weekly" file is never replaced."""
    d = pathlib.Path(root) / 'data/weekly'; d.mkdir(parents=True, exist_ok=True); saved, skipped = [], []
    for label, snap in sorted(snaps.items()):
        path = d / (label + '.json'); body = json.dumps(snap, indent=1, sort_keys=True) + '\n'
        try:
            with open(path, 'x', encoding='utf-8') as fh: fh.write(body)
            saved.append(label); continue
        except FileExistsError: pass
        old = json.loads(path.read_text())
        if replace_backfill and old.get('kind') == 'backfill' and snap.get('kind') == 'backfill' and old.get('schema_version', 0) < snap['schema_version']:
            tmp = path.with_suffix('.tmp'); tmp.write_text(body); os.replace(tmp, path); saved.append(label)
        else: skipped.append(label)
    write_index(root)
    return saved, skipped

def write_index(root):
    d = pathlib.Path(root) / 'data/weekly'; weeks = []
    for f in sorted(d.glob('????-W??.json')):
        s = json.loads(f.read_text())
        weeks.append({'week': s['week'], 'start_utc': s['start_utc'], 'kind': s['kind'], 'saved_at': s['saved_at'], 'path': f.name})
    (d / 'index.json').write_text(json.dumps({'schema_version': SCHEMA, 'weeks': weeks}, indent=1) + '\n')

def main(argv=None):
    a = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    a.add_argument('--root', type=pathlib.Path, default=pathlib.Path(__file__).resolve().parent.parent)
    a.add_argument('--backfill', action='store_true'); a.add_argument('--week', help='only this ISO week, e.g. 2026-W31')
    a.add_argument('--dry-run', action='store_true'); a.add_argument('--replace-backfill', action='store_true')
    args = a.parse_args(argv); root = args.root.resolve()
    existing = {p.stem for p in (root / 'data/weekly').glob('????-W??.json')} if (root / 'data/weekly').is_dir() else set()
    redo = args.backfill and args.replace_backfill
    snaps = build(root, lambda w: (redo or w not in existing) and (not args.week or w == args.week), args.backfill)
    if args.dry_run: print('would save:', ', '.join(snaps) or 'nothing'); return 0
    saved, skipped = save(root, snaps, redo)
    print('saved:', ', '.join(saved) or 'nothing new', '| already saved:', ', '.join(sorted(existing)) or 'none'); return 0

if __name__ == '__main__': sys.exit(main())
