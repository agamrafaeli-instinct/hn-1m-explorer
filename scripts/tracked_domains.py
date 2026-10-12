#!/usr/bin/env python3
"""Build data/tracked_domains.json: the 1,000 domains with the most total story points across the full archive
(data/archive/stories-*.parquet, 2006 to the newest saved month). See docs/TRACKED_LISTS.md.
The list is rebuilt on purpose, not daily, so weekly counts stay comparable. A rebuild bumps `version`.

  python scripts/tracked_domains.py          build, bump the version if the list changed
  python scripts/tracked_domains.py --check  exit 1 if the file is missing or not 1,000 ranked rows"""
import argparse, json, pathlib, sys

N = 1000
HOST = r'^https?://(?:www\.)?([^/:?#]+)'  # same rule as scripts/atlas_aggregates.py

def build(root):
    import duckdb
    root = pathlib.Path(root); db = duckdb.connect()
    db.execute("SET memory_limit='1GB'"); db.execute('SET threads=2'); db.execute("SET temp_directory='/tmp/duck_tmp'")
    q = ("SELECT dom, sum(coalesce(score,0))::BIGINT AS points, count(*) AS stories FROM ("
         "SELECT regexp_extract(lower(coalesce(url,'')), ?, 1) AS dom, score, time FROM read_parquet(?)) "
         "WHERE dom <> '' GROUP BY dom ORDER BY points DESC, dom LIMIT ?")
    rows = db.execute(q, [HOST, str(root / 'data/archive/stories-*.parquet'), N]).fetchall()
    lo, hi = db.execute("SELECT strftime(min(time AT TIME ZONE 'UTC'), '%Y-%m'), strftime(max(time AT TIME ZONE 'UTC'), '%Y-%m') FROM read_parquet(?)", [str(root / 'data/archive/stories-*.parquet')]).fetchone()
    return [[d, int(p), int(n)] for d, p, n in rows], [lo, hi]

def write(root, rows, rng):
    out = pathlib.Path(root) / 'data' / 'tracked_domains.json'
    old = json.loads(out.read_text()) if out.exists() else {}
    same = [r[0] for r in old.get('domains', [])] == [r[0] for r in rows]
    version = old.get('version', 0) if same and old else old.get('version', 0) + 1
    doc = {'schema': 1, 'version': version, 'rule': 'Top 1,000 domains by total story points across the full archive. www. is removed. Rebuilt on purpose, not daily.',
           'archive_range': rng, 'caveat': 'Archive scores are as fetched. Stories from 2025 and 2026 carry low scores, so the ranking leans on earlier years.',
           'columns': ['domain', 'points', 'stories'], 'domains': rows}
    out.write_text(json.dumps(doc, indent=0) + '\n'); return version

def check(root):
    p = pathlib.Path(root) / 'data' / 'tracked_domains.json'
    if not p.exists(): return 1, 'data/tracked_domains.json is missing. Run: python scripts/tracked_domains.py'
    d = json.loads(p.read_text()); r = d.get('domains', [])
    if len(r) != N: return 1, f'Expected {N} domains, found {len(r)}.'
    if [x[1] for x in r] != sorted((x[1] for x in r), reverse=True): return 1, 'Domains are not ranked by points.'
    return 0, f'{N} domains, version {d.get("version")}.'

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--root', default='.'); ap.add_argument('--check', action='store_true'); a = ap.parse_args()
    if a.check: rc, m = check(a.root); print(m); sys.exit(rc)
    rows, rng = build(a.root); v = write(a.root, rows, rng); print(f'{len(rows)} domains, version {v}, archive {rng[0]} to {rng[1]}; top: ' + ', '.join(r[0] for r in rows[:8]))
