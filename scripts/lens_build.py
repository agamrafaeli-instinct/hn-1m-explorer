#!/usr/bin/env python3
"""Build the Lens history files from the saved weekly files (docs/LENS_SPEC.md).

data/lens/index.json lists domains seen in 3 or more saved weeks and every watchlist name.
data/lens/<id>.json holds one entry: stories and points (domain) or mentions (name) per saved week.
Reads data/weekly/<week>.json only. Safe to rerun.
"""
import argparse, glob, json, os, re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
MIN_WEEKS = 3
FLOOR = 8
MAX_TOP = 5


def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def load_weeks(weekly_dir):
    weeks = []
    for f in sorted(glob.glob(os.path.join(weekly_dir, '20*-W*.json'))):
        w = json.load(open(f))
        weeks.append(w)
    return weeks


def build(weeks):
    names = []
    for w in weeks:
        for n in w.get('vcs', {}).get('watchlist', {}).get('mentions', {}):
            if n not in names: names.append(n)
    seen_in = {}
    for w in weeks:
        for d, v in w.get('domains', {}).items():
            seen_in[d] = seen_in.get(d, 0) + 1
    entries = {}
    for d in sorted(x for x, n in seen_in.items() if n >= MIN_WEEKS):
        rows, top = [], []
        for w in weeks:
            v = w.get('domains', {}).get(d)
            rows.append({'week': w['week'], 'backfill': w.get('kind') == 'backfill',
                         'stories': v[0] if v else None, 'points': v[1] if v else None,
                         'small': bool(v and v[0] < FLOOR)})
            for s in w.get('top_stories', []):
                if s.get('domain') == d:
                    top.append({'week': w['week'], 'id': s['id'], 'title': s['title'], 'points': s['points'], 'comments': s['comments']})
        first = next((r['week'] for r in rows if r['stories']), None)
        top.sort(key=lambda s: (-s['points'], s['id']))
        entries[d] = {'id': d, 'kind': 'domain', 'label': d, 'first_seen': first, 'weeks': rows, 'top_stories': top[:MAX_TOP]}
    for n in names:
        rows = []
        for w in weeks:
            m = w.get('vcs', {}).get('watchlist', {}).get('mentions', {})
            rows.append({'week': w['week'], 'backfill': w.get('kind') == 'backfill',
                         'mentions': m.get(n), 'small': m.get(n) is not None and m[n] < FLOOR})
        first = next((r['week'] for r in rows if r['mentions']), None)
        entries['n-' + slug(n)] = {'id': 'n-' + slug(n), 'kind': 'name', 'label': n, 'first_seen': first, 'weeks': rows}
    index = [{'id': e['id'], 'kind': e['kind'], 'label': e['label'], 'first_seen': e['first_seen']} for e in entries.values()]
    index.sort(key=lambda e: (e['kind'], e['label'].lower()))
    return index, entries


def run(weekly_dir, out_dir):
    weeks = load_weeks(weekly_dir)
    index, entries = build(weeks)
    os.makedirs(out_dir, exist_ok=True)
    for f in glob.glob(os.path.join(out_dir, '*.json')): os.remove(f)
    json.dump({'weeks': [w['week'] for w in weeks], 'entries': index}, open(os.path.join(out_dir, 'index.json'), 'w'), separators=(',', ':'), sort_keys=True)
    for e in entries.values():
        json.dump(e, open(os.path.join(out_dir, e['id'] + '.json'), 'w'), separators=(',', ':'), sort_keys=True)
    return len(index)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--weekly', default=os.path.join(ROOT, 'data/weekly'))
    ap.add_argument('--out', default=os.path.join(ROOT, 'data/lens'))
    a = ap.parse_args()
    print('lens entries: %d' % run(a.weekly, a.out))
