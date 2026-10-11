#!/usr/bin/env python3
"""Story finder, step 4 (#181): publish the day's pick. The top story goes live by itself each day (Decision 2026-10-11).
  python3 scripts/finder_publish.py [--date YYYY-MM-DD]
Run after finder_select.py (it wrote data/finder/<date>.json) and, for the pick, finder_dictionary.py term <id>.
Adds the story block (headline, rows, takeaway, limit) built from the evidence numbers only, writes data/finder/latest.json (one line for the
home page) and appends the pick to data/finder/shown.json. A rerun on the same date changes nothing. With no pick, latest.json is removed so the home entry hides.
"""
import json, os, sys, datetime as dt
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

def pct(v): return ('%.3f' if v < 0.001 else '%.2f' if v < 0.01 else '%.1f') % (v * 100) + '%'
def x(v): return ('%.0f' if v >= 10 else '%.1f' if v >= 1 else '%.2f') % v + 'x'
def mo(s): return s
def row(label, w): return {'label': label, 'from': w['from'], 'to': w['to'], 'n': w['n'], 'total': w['total'], 'share': w['share']}

def story(e):
    L, g, W, R = e['label'], e['generator'], e['windows'], e['ratios']
    if g == 'reversal':
        head = '%s: up against all earlier years, down against its peak year' % L
        rows = [row('Latest 12 months', W['latest']), row('Peak year %s' % W['peak']['year'], W['peak']), row('All earlier months', W['prior'])]
        take = 'The answer depends on the base window. Against all earlier months the share is %s. Against the peak year it is %s.' % (x(R['latest_vs_prior']), x(R['latest_vs_peak']))
    elif g == 'cross_window':
        head = '%s: the answer depends on which earlier window you pick' % L
        rows = [row('Latest 12 months', W['latest']), row('All earlier months', W['prior']), row('The 12 months before', W['before'])]
        take = 'Against all earlier months the share is %s. Against the 12 months just before it is %s.' % (x(R['latest_vs_prior']), x(R['latest_vs_before']))
    else:
        head = '%s: the latest month is above every month of the year before' % L
        m, rg = W['month'], W['range_prev_12']
        rows = [row('Latest month', m), {'label': 'Highest month of the year before', 'from': rg['from'], 'to': rg['to'], 'share': rg['max']}]
        take = 'The latest month is %s the highest month of the 12 before it.' % x(R['month_vs_prev_max'])
    opening = '%s matched %s of story titles in the latest window (%s of %s stories).' % (L, pct(rows[0]['share']), format(rows[0].get('n', 0), ','), format(rows[0].get('total', 0), ','))
    limit = 'Title matching only: the word list will miss and mis-match some stories. Archive scores for 2025-26 are low for all stories, so only shares of titles are used.'
    return {'headline': head, 'opening': opening, 'rows': rows, 'takeaway': take, 'limit': limit}

def main(today):
    d = os.path.join(ROOT, 'data/finder'); p = os.path.join(d, today + '.json'); lp = os.path.join(d, 'latest.json'); sp = os.path.join(d, 'shown.json')
    if not os.path.exists(p):
        if os.path.exists(lp): os.remove(lp)
        print('no pick for', today); return
    e = json.load(open(p))
    if 'story' not in e:
        e['story'] = story(e); e['date'] = today
        dp = 'data/finder/dictionaries/%s.json' % e['term']; e['dictionary'] = dp if os.path.exists(os.path.join(ROOT, dp)) else None
        json.dump(e, open(p, 'w'), indent=1, sort_keys=True)
    json.dump({'date': today, 'term': e['term'], 'headline': e['story']['headline']}, open(lp, 'w'), indent=1, sort_keys=True)
    shown = json.load(open(sp)) if os.path.exists(sp) else []
    if not any(s['term'] == e['term'] and s['date'] == today for s in shown):
        shown.append({'term': e['term'], 'date': today}); json.dump(shown, open(sp, 'w'), indent=1, sort_keys=True)
    print('published', e['term'], today)

if __name__ == '__main__':
    a = sys.argv[1:]; main(a[a.index('--date') + 1] if '--date' in a else dt.date.today().isoformat())
