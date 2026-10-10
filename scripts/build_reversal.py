#!/usr/bin/env python3
"""Builds data/reversal.json (the numbers behind #/lesson) from docs/research/reversal_handoff.json and docs/research/polymarket_screens.json.
Both inputs are dictionary screens on story titles. Latest window Aug 2025 to Jul 2026, history Oct 2006 to Jul 2025, peak = highest earlier rolling 12 months."""
import json, os
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
a = json.load(open(os.path.join(R, 'docs/research/reversal_handoff.json'))); b = json.load(open(os.path.join(R, 'docs/research/polymarket_screens.json')))
def row(key, label, kind, src, note):
    s = src[key]; g = s.get('earlier') or s['history']; pk = s.get('peak_earlier_12') or s['peak']; l = s['latest']
    w = lambda x: (x.get('from') or x['start'], x.get('to') or x['end'])
    return {'label': label, 'kind': kind, 'note': note, 'latest': {'n': l['n'], 'total': l['total'], 'pct': l['pct'], 'window': w(l)},
            'history': {'n': g['n'], 'total': g['total'], 'pct': g['pct'], 'window': w(g)}, 'peak': {'n': pk['n'], 'total': pk['total'], 'pct': pk['pct'], 'window': w(pk)},
            'vs_history': l['pct'] / g['pct'], 'vs_peak': l['pct'] / pk['pct']}
rows = [row('GPT', 'ChatGPT and GPT', 'reversal', a, 'Down from its peak year, well above everything before it.'),
        row('Ukraine country/context', 'Ukraine', 'peak decay', a, 'Below its 2022 peak and a little below its own history. Not war-only, not all Russia stories.'),
        row('Basic income family', 'Basic income', 'peak decay', a, 'Below its 2016-17 peak and below history. Includes targeted experiments, so not only universal basic income.'),
        row('YC attributed', 'Y Combinator', 'peak decay', a, 'Includes batch labels like "YC S25". Without them it is 0.59x history. The 2007 peak is a tiny base, so it is fragile. Not a sign that startup interest fell.'),
        row('Data centers, all', 'Data centers', 'emergence', b, 'Above its own peak and above history.'),
        row('Shipping chokepoints', 'Shipping chokepoints', 'episode', b, 'Back at the level of its 2021 peak year, far above history.'),
        row('Recession concern family, global', 'Recession', 'peak decay', b, 'Below history and far below 2008-09. A control: nothing to see.')]
dc, pr = b['Data centers, all']['latest'], b['Data-center resource/policy pressure']
frame = {'latest': {'n': pr['latest']['n'], 'of': dc['n'], 'share': pr['latest']['n'] / dc['n']}, 'history': {'n': pr['history']['n'], 'of': b['Data centers, all']['history']['n'], 'share': pr['history']['n'] / b['Data centers, all']['history']['n']}}
out = {'note': 'Dictionary screens on story titles, not semantic topic estimates. Built by scripts/build_reversal.py from docs/research/.', 'rows': rows, 'framing': frame, 'caveat': a['_method']['caveat']}
json.dump(out, open(os.path.join(R, 'data/reversal.json'), 'w'), indent=1); print(json.dumps(frame)); [print(r['label'], round(r['vs_history'], 2), round(r['vs_peak'], 2)) for r in rows]
