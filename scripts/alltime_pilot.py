#!/usr/bin/env python3
"""All-time pilot: compare a title-term share between an early and a late window,
once with the old style window (Jan-Jun 2023 vs Jan-Jun 2026) and once all-time
(all stories since 2006 up to Jul 2025, pooled, vs the latest 12 months; a 2007-only base is empty for terms that did not exist yet). Live stories only, from data/archive."""
import duckdb, json, glob, sys
TERMS = {
 'react': r'\breact(\.js|js)?\b',
 'rust': r'\brust\b',
 'typescript': r'\btypescript\b',
 'agents': r'\bagents?\b',
 'gpt': r'\b(chatgpt|gpt-?[0-9a-z.]*)\b',
}
# thresholds copied from card h012: >=1.5 strong supported, >=1.15 weak, <=0.9 refuted
def verdict(r):
    if r is None: return 'no data'
    if r >= 1.5: return 'supported (strong)'
    if r >= 1.15: return 'supported (weak)'
    if r <= 0.9: return 'refuted'
    return 'inconclusive'
con = duckdb.connect()
files = sorted(glob.glob('data/archive/stories-*.parquet'))
con.execute("create view s as select * from read_parquet(%s) where title is not null" % json.dumps(files))
def share(rx, lo, hi):
    n, t = con.execute("select count(*) filter (where regexp_matches(lower(title), ?)), count(*) from s where time >= ? and time < ?", [rx, lo, hi]).fetchone()
    return n, t
W = {
 'old_early': ('2023-01-01', '2023-07-01'), 'old_late': ('2026-01-01', '2026-07-01'),
 'all_early': ('2006-01-01', '2025-08-01'), 'all_late': ('2025-08-01', '2026-08-01'),
}
out = {}
for k, rx in TERMS.items():
    row = {}
    for w, (lo, hi) in W.items():
        n, t = share(rx, lo, hi); row[w] = {'n': n, 'total': t, 'share': n / t if t else None}
    for kind in ('old', 'all'):
        a, b = row[kind + '_late']['share'], row[kind + '_early']['share']
        r = (a / b) if (a is not None and b) else None
        row[kind + '_ratio'] = r; row[kind + '_verdict'] = verdict(r)
    yrs = {}
    for y in range(2006, 2027):
        n, t = share(rx, f'{y}-01-01', f'{y+1}-01-01'); yrs[y] = round(100 * n / t, 3) if t else None
    row['share_pct_by_year'] = yrs
    out[k] = row
json.dump(out, open('data/alltime_pilot.json', 'w'), indent=1)
for k, r in out.items():
    f = lambda x: 'n/a' if x is None else '%.2f' % x
    print(k, 'old', f(r['old_ratio']), r['old_verdict'], '| all', f(r['all_ratio']), r['all_verdict'], '| early n', r['all_early']['n'])
