#!/usr/bin/env python3
"""Reproduce round 2 from the frozen plan and ONLY manifest-listed CSV chunks."""
import argparse, collections, csv, datetime as dt, hashlib, json, math, pathlib, re
csv.field_size_limit(10**9)
DAY = 86400

def week(t):
    day = t // DAY
    return (day - (day + 3) % 7) * DAY

def measure(rows):
    scores = [r[1] for r in rows if r[1] is not None]
    comments = [r[2] for r in rows if r[2] is not None]
    pairs = [r for r in rows if r[1] is not None and r[2] is not None]
    trimmed = sorted(scores, reverse=True)[math.ceil(len(scores) * .01):]
    return dict(stories=len(rows), score_stories=len(scores), comment_stories=len(comments),
                points=sum(scores), comments=sum(comments), hit10=sum(s >= 10 for s in scores),
                paired_points=sum(r[1] for r in pairs), paired_comments=sum(r[2] for r in pairs),
                trimmed_points=sum(trimmed), trimmed_stories=len(trimmed))

def aggregate(rows, bounds, tests):
    lo, hi = bounds
    start = week(lo) + (0 if week(lo) == lo else 7 * DAY)
    end = week(hi + 1)
    weeks = list(range(start, end, 7 * DAY))
    kept = [r for r in rows if start <= r[0] < end]
    output = dict(window=dict(min=lo, max=hi, start_utc=dt.datetime.fromtimestamp(start, dt.timezone.utc).isoformat(),
                              end_exclusive_utc=dt.datetime.fromtimestamp(end, dt.timezone.utc).isoformat(), stories=len(kept), weeks=len(weeks)), series={}, weekday={}, totals={})
    for spec in tests:
        rx = re.compile(spec['pattern'], re.I)
        tagged = [(r, bool(rx.search(r[3]))) for r in kept]
        output['totals'][spec['key']] = measure([r for r, yes in tagged if yes])
        byweek = collections.defaultdict(lambda: [[], []])
        byday = [[[], []] for _ in range(7)]
        for r, yes in tagged:
            side = 0 if yes else 1
            byweek[week(r[0])][side].append(r)
            byday[((r[0] // DAY) + 3) % 7][side].append(r)
        def row(label, groups):
            a, b = map(measure, groups)
            return dict(label=label, total_stories=a['stories'] + b['stories'], **a, **{'rest_' + k: v for k, v in b.items()})
        output['series'][spec['key']] = [row(dt.datetime.fromtimestamp(w, dt.timezone.utc).date().isoformat(), byweek[w]) for w in weeks]
        output['weekday'][spec['key']] = [row(label, groups) for label, groups in zip(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], byday)]
    return output

def build(root):
    rawplan = (root / 'docs/curious-round2-plan.json').read_bytes()
    plan = json.loads(rawplan)
    manifest = json.loads((root / 'data/manifest.json').read_text())
    rows, lo, hi, seen = [], None, None, set()
    for chunk in manifest['chunks']:
        with (root / chunk['path']).open(newline='', encoding='utf-8') as file:
            for r in csv.DictReader(file):
                if r['id'] in seen: raise ValueError('Duplicate manifest item ' + r['id'])
                seen.add(r['id'])
                if not r['time']: continue
                t = int(r['time'])
                lo = t if lo is None else min(lo, t); hi = t if hi is None else max(hi, t)
                if r['type'] != 'story' or r['dead'] == '1' or r['deleted'] == '1': continue
                rows.append((t, int(r['score']) if r['score'] else None, int(r['descendants']) if r['descendants'] else None, r['title']))
    if len(seen) != manifest['total_rows']: raise ValueError('Manifest row count mismatch')
    out = aggregate(rows, (lo, hi), plan['tests'])
    out['provenance'] = dict(manifest_generated_at=manifest['generated_at'], manifest_rows=len(seen), plan_sha256=hashlib.sha256(rawplan).hexdigest(),
                             source_repository='https://github.com/agamrafaeli-instinct/hn-1m-explorer', score_policy=manifest.get('daily_update', {}).get('score_policy', 'snapshot at collection'))
    (root / 'data/curious_round2.json').write_text(json.dumps(out, indent=1) + '\n')
    print(out['window'])

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--root', type=pathlib.Path, default=pathlib.Path(__file__).resolve().parent.parent)
    build(parser.parse_args().root)
