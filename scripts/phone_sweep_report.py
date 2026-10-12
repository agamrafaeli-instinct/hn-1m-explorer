#!/usr/bin/env python3
"""Turn phone_sweep.json into one issue body (#245).
  phone_sweep_report.py phone_sweep.json   -> prints JSON {count, body}
count = screen-widths with a finding (sideways scroll, tap target under 44 px, control with no label, chart with no name).
count 0 means no issue is opened."""
import json, sys


def build(rows, url=''):
    bad = [r for r in rows if r.get('scroll', 0) > 0 or r.get('tap') or r.get('unl') or r.get('svgs')]
    lines = [f'Nightly phone sweep: {len(bad)} of {len(rows)} screen-widths have a finding. Widths: 320, 390 and 430 px. Report only; it never blocks a deploy.', '']
    by = {}
    for r in bad:
        by.setdefault(r['screen'], []).append(r)
    for screen, rs in by.items():
        lines.append(f'**{screen}**')
        for r in rs:
            parts = []
            if r.get('scroll', 0) > 0: parts.append(f"sideways scroll {r['scroll']} px")
            if r.get('tap'): parts.append(f"{len(r['tap'])} tap targets under 44 px (e.g. {r['tap'][0]})")
            if r.get('unl'): parts.append(f"{len(r['unl'])} controls with no label")
            if r.get('svgs'): parts.append(f"{r['svgs']} charts with no name")
            lines.append(f"- {r['w']} px: " + '; '.join(parts))
        lines.append('')
    if url: lines.append(f'Run: {url}')
    return len(bad), '\n'.join(lines).strip()


if __name__ == '__main__':
    n, body = build(json.load(open(sys.argv[1])), sys.argv[2] if len(sys.argv) > 2 else '')
    print(json.dumps({'count': n, 'body': body}))
