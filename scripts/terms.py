#!/usr/bin/env python3
"""Weekly story counts for named title baskets, used by hypothesis cards.

Output (added to data/summary.json as "terms"): {"weekly": [{"week": "2026-07-27", "stories": n, "points": n,
"<basket>_stories": n, "<basket>_points": n, "<basket>_rest_stories": n, "<basket>_rest_points": n}, ...]}
Weeks are Monday-start UTC and only complete weeks inside the data window are kept. Stories only.
A new basket is a code change here (separate PR), then cards can use its fields.
"""
import re, datetime as dt

BASKETS = {
    # engineers: the newer systems languages
    'newsys': r'\b(rust|zig|rustc|cargo)\b',
    # deep tech: hardware, physics, bio and energy topics that venture investors watch
    'deeptech': r'\b(quantum|qubits?|fusion|crispr|photonics?|photonic|neuromorphic|lidar|superconduct\w*|solid-state|risc-v|lithography|fpga|asic|mrna|perovskite|fission|reactor|semiconductors?|gene editing|synthetic biology|tokamak|battery|batteries)\b',
    # curious non-engineers: odd, old, lost and mysterious
    'weird': r'\b(weird|strange|bizarre|mysterious|mystery|unusual|odd|curious|ancient|abandoned|forgotten|haunted|secret|unexplained|oldest|accidentally)\b',
}
_RX = {k: re.compile(v, re.I) for k, v in BASKETS.items()}
DAY = 86400


def compute(db):
    lo, hi = db.execute('SELECT min(time),max(time) FROM items').fetchone()
    if lo is None: return {'weekly': []}
    weeks = {}
    for t, score, title in db.execute("SELECT time,score,title FROM items WHERE type='story' AND time IS NOT NULL AND coalesce(dead,0)=0 AND coalesce(deleted,0)=0"):
        d = dt.datetime.fromtimestamp(t, dt.timezone.utc).date()
        start = int(dt.datetime.combine(d - dt.timedelta(days=d.weekday()), dt.time(), dt.timezone.utc).timestamp())
        if start < lo or start + 7 * DAY - 1 > hi: continue
        w = weeks.setdefault(start, {'stories': 0, 'points': 0})
        s = score or 0; w['stories'] += 1; w['points'] += s
        for k, rx in _RX.items():
            hit = bool(title and rx.search(title))
            key = k if hit else k + '_rest'
            w[key + '_stories'] = w.get(key + '_stories', 0) + 1
            w[key + '_points'] = w.get(key + '_points', 0) + s
    rows = []
    for start in sorted(weeks):
        r = {'week': dt.datetime.fromtimestamp(start, dt.timezone.utc).strftime('%Y-%m-%d')}
        r.update(weeks[start])
        for k in BASKETS:
            for suffix in ('', '_rest'):
                for m in ('_stories', '_points'): r.setdefault(k + suffix + m, 0)
        rows.append(r)
    return {'weekly': rows}
