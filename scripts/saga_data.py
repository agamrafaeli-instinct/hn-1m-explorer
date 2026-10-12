#!/usr/bin/env python3
"""Build data/saga.json for Saga beat 2 (#261): stories and points per story for each year, from data/history/daily.csv.
A month is low-score when its points per story fall under 4 (from 2010 on). A year is flagged when half or more of its months are low,
so the chart can show those years as hollow bars instead of comparing them. Run from the repo root."""
import csv, json
import os
from pathlib import Path
from collections import defaultdict
ROOT = Path(os.environ.get('HN_ROOT') or Path(__file__).resolve().parent.parent)  # HN_ROOT: test fixture (#248)

def build(root=ROOT):
    mon = defaultdict(lambda: [0, 0])
    for r in csv.DictReader(open(Path(root) / 'data/history/daily.csv')):
        m = mon[r['date'][:7]]; m[0] += int(r['stories']); m[1] += int(r['score_sum_stories'])
    years = sorted({int(k[:4]) for k in mon})
    out = {'schema': 1, 'built_from': 'scripts/saga_data.py', 'years': years, 'stories': [], 'points_per_story': [], 'low_score_years': [], 'first_month': min(mon), 'last_month': max(mon)}
    for y in years:
        ms = [v for k, v in mon.items() if k.startswith(str(y))]
        st = sum(v[0] for v in ms); pt = sum(v[1] for v in ms)
        low = sum(1 for v in ms if v[0] and v[1] / v[0] < 4)
        out['stories'].append(st); out['points_per_story'].append(round(pt / st, 2) if st else 0)
        if y >= 2010 and low * 2 >= len(ms): out['low_score_years'].append(y)
    return out

if __name__ == '__main__':
    (ROOT / 'data/saga.json').write_text(json.dumps(build(), separators=(',', ':')) + '\n')
