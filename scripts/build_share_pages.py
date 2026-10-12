#!/usr/bin/env python3
"""Build static share pages so a pasted link previews with the right title (docs/SHARING.md)."""
import html, json, pathlib

SITE = 'Hacker News posts, explored'
SKIP = {'index.json', 'bundle.json', 'tally.json'}

def page(title, desc, target):
    t, d = html.escape(title, quote=True), html.escape(desc, quote=True)
    return ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>{t}</title><meta name="description" content="{d}">'
            f'<meta property="og:type" content="website"><meta property="og:site_name" content="{SITE}">'
            f'<meta property="og:title" content="{t}"><meta property="og:description" content="{d}">'
            f'<meta name="twitter:card" content="summary"><meta name="twitter:title" content="{t}">'
            f'<meta name="twitter:description" content="{d}">'
            f'<meta http-equiv="refresh" content="0;url={target}"></head>'
            f'<body><p><a href="{target}">{t}</a></p><p>{d}</p>'
            f'<script>location.replace({json.dumps(target)})</script></body></html>\n')

def card_pages(site):
    site = pathlib.Path(site); hd = site / 'hypotheses'; out = site / 'share' / 'c'
    out.mkdir(parents=True, exist_ok=True); n = 0
    for f in sorted(hd.glob('*.json')):
        if f.name in SKIP: continue
        c = json.loads(f.read_text())
        if not (isinstance(c, dict) and c.get('id') and c.get('title')): continue
        desc = c.get('hypothesis') or c['title']
        (out / (c['id'] + '.html')).write_text(page(c['title'] + ' (Hacker News, tested)', desc, '../../#/c/' + c['id']))
        n += 1
    return n

if __name__ == '__main__':
    import sys
    print('share pages:', card_pages(sys.argv[1] if len(sys.argv) > 1 else '_site'))
