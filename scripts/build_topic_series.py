#!/usr/bin/env python3
"""Builds data/topic_series.json for the Compare view (#169 stage 1). One row per topic in data/film_shares.json:
monthly title share, latest-12-months share, pooled share of all earlier months, their ratio, the peak year (calendar year with the highest share),
and a pattern badge. Title matching only: the matcher is the regex in scripts/film.py, kept in the output so the dictionary is visible.
Pattern rules, in this order (documented on the Method page):
  Emergence         ratio >= 2 and the peak year is within the latest 12 months or the year before it.
  Reversal          peak share >= 2x latest share and latest share >= 1.5x the pooled earlier share.
  Peak decay        latest share <= 0.6x peak share and ratio < 1.5.
  Composition shift ratio >= 1.25 or <= 0.8 and none of the above.
  Steady            everything else.
"""
import json, os
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
fs = json.load(open(os.path.join(R, 'data/film_shares.json')))
M = fs['monthly']; months = [m['month'] for m in M]
def share(rows, k): 
    n = sum(r[k + '_s'] for r in rows); t = sum(r['total'] for r in rows); return (n / t if t else 0.0), n, t
def pattern(latest, prior, ratio, peak, peak_year, last_year):
    if prior == 0: return 'Emergence' if latest > 0 else 'Steady'
    if ratio >= 2 and peak_year >= last_year - 1: return 'Emergence'
    if peak >= 2 * latest and latest >= 1.5 * prior: return 'Reversal'
    if latest <= 0.6 * peak and ratio < 1.5: return 'Peak decay'
    if ratio >= 1.25 or ratio <= 0.8: return 'Composition shift'
    return 'Steady'
out = {'note': 'Monthly title share per topic, built by scripts/build_topic_series.py from data/film_shares.json. Title matching only; archive scores are not used.',
       'months': months, 'windows': {'latest': [months[-12], months[-1]], 'prior': [months[0], months[-13]]}, 'topics': []}
last_year = int(months[-1][:4])
for k, t in fs['terms'].items():
    series = [round((m[k + '_s'] / m['total']) if m['total'] else 0.0, 6) for m in M]
    ls, ln, lt = share(M[-12:], k); ps, pn, pt = share(M[:-12], k)
    by = {}
    for m in M:
        y = int(m['month'][:4]); a = by.setdefault(y, [0, 0]); a[0] += m[k + '_s']; a[1] += m['total']
    yrs = {y: (a[0] / a[1] if a[1] else 0) for y, a in by.items() if a[1] >= 1000}
    py = max(yrs, key=yrs.get); peak = yrs[py]
    ratio = (ls / ps) if ps else None
    out['topics'].append({'id': k, 'label': t['label'], 'matcher': t['pattern'], 'series': series,
        'latest': {'n': ln, 'total': lt, 'share': ls}, 'prior': {'n': pn, 'total': pt, 'share': ps},
        'ratio': ratio, 'peak': {'year': py, 'share': peak}, 'pattern': pattern(ls, ps, ratio or 0, peak, py, last_year)})
json.dump(out, open(os.path.join(R, 'data/topic_series.json'), 'w'), separators=(',', ':'))
c = {}
for t in out['topics']: c[t['pattern']] = c.get(t['pattern'], 0) + 1
print('topic_series.json', len(out['topics']), 'topics', c)
