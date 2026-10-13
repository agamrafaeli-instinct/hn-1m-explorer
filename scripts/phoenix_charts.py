#!/usr/bin/env python3
"""Draw the three comeback lines on #/phoenix as inline SVG (#366). Run it after the data changes; it rewrites the block
between the PHOENIX_CHARTS markers in index.html. Every number comes from data/atlas (term counts by month, months.json
for stories held) and data/resurfacing/groups.json (quiet spell start and return month)."""
import json, pathlib, re, html
ROOT = pathlib.Path(__file__).resolve().parents[1]
PICK = ['trump', 'bing', 'cuba']
W, H, PL, PR, PT, PB = 360, 130, 6, 6, 8, 20

def months_list():
    m = json.loads((ROOT / 'data/atlas/months.json').read_text())['months']
    return [(x['month'], x.get('stories_held', 0)) for x in m if x['month'] < '2026-08']

def series(term, ms):
    f = ROOT / 'data/atlas' / ('terms-%s.json' % term[0])
    d = json.loads(f.read_text())['terms'][term]
    return [(d.get(mo, 0) / held * 10000 if held else 0) for mo, held in ms]

def chart(term, ms, ret):
    s = series(term, ms); n = len(s); top = max(s) or 1
    x = lambda i: PL + (W - PL - PR) * i / (n - 1)
    y = lambda v: PT + (H - PT - PB) * (1 - v / top)
    idx = {mo: i for i, (mo, _) in enumerate(ms)}
    a, b = idx[ret['start']], idx[ret['return']]
    pts = ' '.join('%.1f,%.1f' % (x(i), y(v)) for i, v in enumerate(s))
    label = '%s: stories with the word per 10,000, by month. Quiet from %s, back in %s. Highest month %.1f.' % (term, ret['start'], ret['return'], top)
    out = ['<figure class="ph_fig"><figcaption><b>%s</b>: quiet from %s, back in %s</figcaption>' % (html.escape(term), ret['start'], ret['return'])]
    out.append('<svg viewBox="0 0 %d %d" role="img" aria-label="%s">' % (W, H, html.escape(label, quote=True)))
    out.append('<rect x="%.1f" y="%d" width="%.1f" height="%d" fill="#e9e2d6"/>' % (x(a), PT, x(b) - x(a), H - PT - PB))
    out.append('<polyline points="%s" fill="none" stroke="#1a1814" stroke-width="1.2"/>' % pts)
    out.append('<line x1="%.1f" x2="%.1f" y1="%d" y2="%d" stroke="#ff6600" stroke-width="2"/>' % (x(b), x(b), PT, H - PB))
    out.append('<text x="%d" y="%d" font-size="10" fill="#6b6258">2006</text><text x="%d" y="%d" font-size="10" fill="#6b6258" text-anchor="end">2026</text>' % (PL, H - 6, W - PR, H - 6))
    out.append('</svg><p class="sg_cav">Grey is the quiet spell, orange is the return month. Highest month: %.1f stories per 10,000.</p></figure>' % top)
    return ''.join(out)

def main():
    ms = months_list()
    rets = {r['subject']: r for r in json.loads((ROOT / 'data/resurfacing/groups.json').read_text())['returns_list'] if r['subject'] in PICK and r['kind'] == 'term'}
    block = '<!--PHOENIX_CHARTS-->' + ''.join(chart(t, ms, rets[t]) for t in PICK) + '<!--/PHOENIX_CHARTS-->'
    p = ROOT / 'index.html'; h = p.read_text()
    if '<!--PHOENIX_CHARTS-->' in h: h = re.sub(r'<!--PHOENIX_CHARTS-->.*?<!--/PHOENIX_CHARTS-->', lambda m: block, h, flags=re.S)
    else:
        a = '<p class="sg_p">We show when each came back, not why.</p>'
        assert a in h; h = h.replace(a, block + a, 1)
    p.write_text(h); print('drew', len(PICK), 'charts')

if __name__ == '__main__': main()
