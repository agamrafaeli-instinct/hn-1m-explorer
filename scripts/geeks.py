#!/usr/bin/env python3
"""Curious-geeks data: story baskets (odd/fun title words) with robust-ness fields. Writes data/geeks.json.
Stories only, dead/deleted excluded, complete Monday-start UTC weeks only. Baskets are fixed here before any card is run.
Per basket row: stories/points/comments/hit10 for the basket and for everything else (rest_*), the same after dropping the
top 1% of stories by score in each side (t_*), and the same after dropping the basket's biggest domain (nd_*)."""
import csv, glob, json, math, os, re, sys, datetime as dt, collections
csv.field_size_limit(10**9)
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
BASKETS = {
 'weird': r'\b(weird|strange|bizarre|mysterious|mystery|unusual|odd|curious|ancient|abandoned|forgotten|haunted|secret|unexplained|oldest|accidentally)\b',
 'science': r'\b(physics|biology|chemistry|astronom\w*|asteroids?|comets?|planets?|dinosaurs?|fossils?|species|octopus|spiders?|insects?|bacteria|fungus|fungi|neurons?|brain|genome|particles?|mathematics|mathematical|primes?|theorem|universe|telescope|volcano|ocean)\b',
 'retro': r'\b(retro|vintage|1970s|1980s|1990s|commodore|amiga|atari|apple ii|c64|zx spectrum|nes|pdp-?\d+|mainframe|floppy|bbs|ms-dos|msdos|cp/m|8-bit|16-bit|arcade)\b',
 'history': r'\b(history|historical|historic|century|centuries|medieval|roman|romans|empire|victorian|archaeolog\w*|antique|museum|1[0-9]{3})\b',
 'puzzle': r'\b(puzzles?|riddles?|chess|sudoku|crosswords?|rubik\w*|maze|wordle|minesweeper|tetris)\b',
 'showhn': r'^show hn',
 'askhn': r'^ask hn',
 'boring': r'\b(enterprise|compliance|saas|b2b|pricing|invoice|erp|crm|webinar|whitepaper)\b',
}
RX = {k: re.compile(v, re.I) for k, v in BASKETS.items()}
def wk(t):
    d = dt.datetime.fromtimestamp(t, dt.timezone.utc).date(); return d - dt.timedelta(days=d.weekday())
rows = []
lo = hi = None
for f in sorted(glob.glob(os.path.join(root, 'posts-*.csv'))):
    with open(f, newline='', encoding='utf-8') as fh:
        for x in csv.DictReader(fh):
            if x['time']:
                t = int(x['time']); lo = t if lo is None or t < lo else lo; hi = t if hi is None or t > hi else hi
            if x['type'] != 'story' or not x['time'] or x['dead'] == '1' or x['deleted'] == '1': continue
            rows.append((int(x['time']), int(x['score'] or 0), int(x['descendants'] or 0), x['domain'], x['title']))
def ok(t):
    s = int(dt.datetime.combine(wk(t), dt.time(), dt.timezone.utc).timestamp()); return s >= lo and s + 7 * 86400 - 1 <= hi
rows = [r for r in rows if ok(r[0])]
tags = [(r, {k for k, rx in RX.items() if r[4] and rx.search(r[4])}) for r in rows]
def agg(items):
    return {'stories': len(items), 'points': sum(r[1] for r in items), 'comments': sum(r[2] for r in items), 'hit10': sum(1 for r in items if r[1] >= 10)}
def trim(items):
    s = sorted(items, key=lambda r: -r[1]); return s[max(1, int(len(s) * 0.01)):]
def put(out, pre, a):
    for k, v in a.items(): out[pre + k] = v
out = {'window': {'min': lo, 'max': hi, 'stories': len(rows)}, 'baskets': [], 'weekly': [], 'weekday': [], 'top_domains': {}, 'top_hits': {}}
for k in BASKETS:
    a = [r for r, t in tags if k in t]; b = [r for r, t in tags if k not in t]
    row = {'name': k, 'one': 1}
    put(row, '', agg(a)); put(row, 'rest_', agg(b)); put(row, 't_', agg(trim(a))); put(row, 't_rest_', agg(trim(b)))
    dom = collections.Counter()
    for r in a: dom[r[3]] += r[1]
    top = dom.most_common(1)[0][0] if dom else ''
    put(row, 'nd_', agg([r for r in a if r[3] != top])); row['top_domain'] = top
    out['top_domains'][k] = dom.most_common(10)
    out['top_hits'][k] = [[r[1], r[2], r[3], r[4]] for r in sorted(a, key=lambda r: -r[1])[:5]]
    out['baskets'].append(row)
# weird by week (lift = weird points/story over rest points/story) and by weekday
wkd = collections.defaultdict(lambda: [[], []]); wd = [[[], []] for _ in range(7)]
for r, t in tags:
    i = 0 if 'weird' in t else 1
    wkd[wk(r[0])][i].append(r); wd[dt.datetime.fromtimestamp(r[0], dt.timezone.utc).weekday()][i].append(r)
def pps(x): return sum(r[1] for r in x) / len(x) if x else 0
for w in sorted(wkd):
    a, b = wkd[w]; row = {'week': w.isoformat(), 'stories': len(a) + len(b), 'lift': pps(a) / pps(b) if pps(b) else 0}
    put(row, 'weird_', agg(a)); put(row, 'rest_', agg(b)); out['weekly'].append(row)
for i, n in enumerate(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']):
    a, b = wd[i]; row = {'day': n, 'stories': len(a) + len(b)}
    put(row, 'weird_', agg(a)); put(row, 'rest_', agg(b)); out['weekday'].append(row)
json.dump(out, open(os.path.join(root, 'geeks.json'), 'w'), indent=1)
print(len(rows), 'stories')
