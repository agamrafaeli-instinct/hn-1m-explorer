#!/usr/bin/env python3
"""Checks on the rolling archive. Limits and their measured values: docs/DATA_CHECKS.md.
Run: python3 scripts/data_checks.py [--root DIR]   Exit 1 if any check fails. Prints one line per check.
"""
import csv, hashlib, json, pathlib, statistics, sys

csv.field_size_limit(10 ** 9)
ROOT = pathlib.Path(sys.argv[sys.argv.index('--root') + 1]) if '--root' in sys.argv else pathlib.Path(__file__).resolve().parent.parent
TYPES = {'story', 'comment', 'job', 'poll', 'pollopt'}
LIMITS = {
    'dead_share_stories': (0.20, 0.45),     # measured 0.31 over the last 10 weeks (docs/WEEKLY_SPEC.md)
    'median_story_score': (1, 6),           # live stories with a score; see docs/DATA_CHECKS.md
    'max_gap_hours': (0, 6),                # longest quiet stretch between two consecutive items
    'comment_share': (0.75, 0.93),          # about 0.84 to 0.89
}


def scan(root):
    m = json.loads((root / 'data/manifest.json').read_text())
    ids = set(); rows = 0; dups = 0; bad_type = 0; bad_time = 0
    stories = dead = 0; comments = 0; scores = []
    times = []; chunk_rows = {}; hash_bad = []
    for ch in m['chunks']:
        p = root / ch['path']
        if not p.exists(): hash_bad.append(ch['path'] + ' missing'); continue
        h = hashlib.sha256(p.read_bytes()).hexdigest()
        if h != ch['sha256']: hash_bad.append(ch['path'])
        n = 0
        with open(p, newline='') as fh:
            for r in csv.DictReader(fh):
                n += 1; rows += 1
                i = r['id']
                if i in ids: dups += 1
                ids.add(i)
                if r['type'] not in TYPES: bad_type += 1
                try: times.append(int(r['time']))
                except ValueError: bad_time += 1
                if r['type'] == 'comment': comments += 1
                if r['type'] == 'story':
                    stories += 1
                    if r['dead'] == '1' or r['deleted'] == '1': dead += 1
                    elif r['score'] != '': scores.append(int(float(r['score'])))
        chunk_rows[ch['path']] = (n, ch['rows'])
    times.sort()
    gap = max((b - a for a, b in zip(times, times[1:])), default=0) / 3600
    return dict(m=m, rows=rows, dups=dups, bad_type=bad_type, bad_time=bad_time, stories=stories, dead=dead, comments=comments,
               median_score=statistics.median(scores) if scores else 0, gap=gap, chunk_rows=chunk_rows, hash_bad=hash_bad)


def evaluate(s):
    out = []
    def add(name, value, ok, limit): out.append((name, value, ok, limit))
    add('total_rows', s['rows'], s['rows'] == s['m']['total_rows'], f"= manifest total_rows ({s['m']['total_rows']})")
    add('chunk_row_counts', sum(1 for a, b in s['chunk_rows'].values() if a != b), all(a == b for a, b in s['chunk_rows'].values()), '0 chunks differ from manifest')
    add('chunk_sha256', len(s['hash_bad']), not s['hash_bad'], '0 chunks differ from manifest')
    add('duplicate_ids', s['dups'], s['dups'] == 0, '0')
    add('unknown_item_types', s['bad_type'], s['bad_type'] == 0, '0')
    add('missing_or_bad_time', s['bad_time'], s['bad_time'] == 0, '0')
    ds = s['dead'] / s['stories'] if s['stories'] else 0; lo, hi = LIMITS['dead_share_stories']
    add('dead_share_stories', round(ds, 4), lo <= ds <= hi, f'{lo} to {hi}')
    lo, hi = LIMITS['median_story_score']; add('median_story_score', s['median_score'], lo <= s['median_score'] <= hi, f'{lo} to {hi}')
    lo, hi = LIMITS['max_gap_hours']; add('max_gap_hours', round(s['gap'], 2), lo <= s['gap'] <= hi, f'{lo} to {hi}')
    cs = s['comments'] / s['rows'] if s['rows'] else 0; lo, hi = LIMITS['comment_share']; add('comment_share', round(cs, 4), lo <= cs <= hi, f'{lo} to {hi}')
    return out


def main():
    res = evaluate(scan(ROOT)); bad = 0
    for name, value, ok, limit in res:
        print(('ok  ' if ok else 'FAIL'), name.ljust(22), str(value).ljust(12), 'limit', limit)
        bad += not ok
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
