#!/usr/bin/env python3
"""Save one snapshot per complete Monday-start UTC week to data/weekly/YYYY-Www.json.

Why: only the newest 1,000,000 items are kept (about 10 weeks), so a week that is not saved is lost for good.
Rules:
  * Only complete weeks that lie inside the archive window are saved (same rule as scripts/terms.py).
  * A saved week is never overwritten. The file is created exclusively; if it exists the week is skipped.
  * Story numbers exclude dead and deleted items and count a missing score or comment count as 0 (same as terms.py, geeks.py).
  * Baskets come from the repo's existing definitions, so nothing is defined twice:
    scripts/terms.py BASKETS, scripts/geeks.py BASKETS, docs/curious-round2-plan.json tests.
Modes:
  (default)    weekly job: kind "weekly".
  --backfill   one-off build of weeks that were not saved when they happened: kind "backfill", with a note saying so.
Usage: python scripts/weekly_snapshot.py [--root DIR] [--backfill] [--week 2026-W31]
"""
import argparse, ast, collections, csv, datetime as dt, json, os, pathlib, re, sys
csv.field_size_limit(10**9)
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
SCHEMA = 1
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

def snapshot(start, stories, counts, baskets, meta):
    tagged = [(s, {k for k, (_, rx) in baskets.items() if s[4] and rx.search(s[4])}) for s in stories]
    out = {'schema_version': SCHEMA, 'week': iso_label(start), 'start_utc': start.isoformat(),
           'end_exclusive_utc': (start + dt.timedelta(days=7)).isoformat(), **meta,
           'items': dict(counts), 'stories': agg(stories),
           'stories_missing_score': sum(1 for s in stories if s[6]),
           'top_stories': top_stories(stories, TOP_STORIES), 'top_domains': top_domains(stories, TOP_DOMAINS),
           'domains': all_domains(stories, DOMAIN_MIN_STORIES), 'baskets': {}}
    for name in sorted(baskets):
        hits = [s for s, tags in tagged if name in tags]
        out['baskets'][name] = {'audience': baskets[name][0], **agg(hits),
                                'top_stories': top_stories(hits, BASKET_STORIES), 'top_domains': top_domains(hits, BASKET_DOMAINS)}
    return out

def build(root, wanted=None, backfill=False, now=None):
    """Return {week_label: snapshot} for complete weeks in the archive that pass `wanted(label)`."""
    root = pathlib.Path(root); baskets = load_baskets(root)
    manifest = json.loads((root / 'data/manifest.json').read_text())
    lo = hi = None
    bucket = collections.defaultdict(lambda: {'stories': [], 'counts': collections.Counter()})
    for r in read_archive(root):
        if not r['time']: continue
        t = int(r['time']); lo = t if lo is None or t < lo else lo; hi = t if hi is None or t > hi else hi
        b = bucket[week_start(t)]; typ = r['type'] or 'other'
        b['counts']['total'] += 1; b['counts'][typ if typ in ('story', 'comment') else 'other'] += 1
        if r['dead'] == '1': b['counts']['dead'] += 1
        if r['deleted'] == '1': b['counts']['deleted'] += 1
        if typ != 'story' or r['dead'] == '1' or r['deleted'] == '1': continue
        no_score = r['score'] == ''
        b['stories'].append((int(r['id']), int(r['score'] or 0), int(r['descendants'] or 0), r['domain'], r['title'], t, no_score))
    now = now or dt.datetime.now(dt.timezone.utc)
    meta_base = {'kind': 'backfill' if backfill else 'weekly', 'saved_at': now.strftime('%Y-%m-%dT%H:%M:%SZ'),
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
        out[label] = snapshot(start, bucket[start]['stories'], bucket[start]['counts'], baskets, meta_base)
    return out

def save(root, snaps):
    """Create each file exclusively. Returns (saved, skipped)."""
    d = pathlib.Path(root) / 'data/weekly'; d.mkdir(parents=True, exist_ok=True); saved, skipped = [], []
    for label, snap in sorted(snaps.items()):
        try:
            with open(d / (label + '.json'), 'x', encoding='utf-8') as fh: fh.write(json.dumps(snap, indent=1, sort_keys=True) + '\n')
            saved.append(label)
        except FileExistsError: skipped.append(label)
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
    a.add_argument('--dry-run', action='store_true')
    args = a.parse_args(argv); root = args.root.resolve()
    existing = {p.stem for p in (root / 'data/weekly').glob('????-W??.json')} if (root / 'data/weekly').is_dir() else set()
    snaps = build(root, lambda w: w not in existing and (not args.week or w == args.week), args.backfill)
    if args.dry_run: print('would save:', ', '.join(snaps) or 'nothing'); return 0
    saved, skipped = save(root, snaps)
    print('saved:', ', '.join(saved) or 'nothing new', '| already saved:', ', '.join(sorted(existing)) or 'none'); return 0

if __name__ == '__main__': sys.exit(main())
