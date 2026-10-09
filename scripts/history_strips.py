#!/usr/bin/env python3
"""Small summaries of data/history/daily.csv and terms_daily.csv for the site: weekday totals and monthly series.
Output: data/history/strips.json. Posts = every item type (as in summary.json's weekday table), points and comments = story totals."""
import csv, json, datetime as dt, collections, pathlib
root = pathlib.Path(__file__).resolve().parent.parent / 'data/history'
daily = list(csv.DictReader((root / 'daily.csv').open()))
wd = collections.defaultdict(lambda: [0, 0, 0]); mon = collections.OrderedDict()
for r in daily:
    d = dt.date.fromisoformat(r['date']); items = sum(int(r[k]) for k in ('stories', 'comments', 'jobs', 'polls', 'pollopts'))
    w = wd[d.weekday()]; w[0] += items; w[1] += int(r['score_sum_stories']); w[2] += int(r['comments_sum_stories'])
    m = mon.setdefault(r['date'][:7], {'month': r['date'][:7], 'items': 0, 'stories': 0, 'comments': 0, 'points': 0, 'days': 0})
    m['items'] += items; m['stories'] += int(r['stories']); m['comments'] += int(r['comments']); m['points'] += int(r['score_sum_stories']); m['days'] += 1
first, last = daily[0]['date'], daily[-1]['date']
ts = lambda s: int(dt.datetime.fromisoformat(s).replace(tzinfo=dt.timezone.utc).timestamp())
months = [m for m in mon.values() if m['days'] >= 28]
terms = collections.defaultdict(lambda: collections.Counter())
for r in csv.DictReader((root / 'terms_daily.csv').open()):
    if r['type'] == 'story':
        for k, v in r.items():
            if k not in ('date', 'type'): terms[k][r['date'][:7]] += int(v)
tshare = {k: [round(c[m['month']] / m['stories'], 5) if m['stories'] else 0 for m in months] for k, c in terms.items()}
out = {'first': first, 'last': last, 'weekday': {'posts': [wd[i][0] for i in range(7)], 'points': [wd[i][1] for i in range(7)], 'comments': [wd[i][2] for i in range(7)]},
       'time_range': {'min': ts(first), 'max': ts(last) + 86399}, 'months': [m['month'] for m in months],
       'monthly': {k: [m[k] for m in months] for k in ('stories', 'comments', 'points')}, 'term_share': tshare}
(root / 'strips.json').write_text(json.dumps(out, separators=(',', ':')))
print(first, last, len(months), 'months', (root / 'strips.json').stat().st_size, 'bytes')
