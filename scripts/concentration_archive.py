#!/usr/bin/env python3
"""Concentration ("centers of gravity") over every archived story, 2006 to the last archived month (#195).
Same calculation as scripts/concentration.py, run over data/archive/stories-*.parquet instead of the newest-items window.
Writes data/atlas/concentration.json. Stories only: the archive holds no comments and no author names, so the author block is empty
and comment-based lenses are not offered. Scores are as saved when each story was fetched (low for 2025 and 2026), so shares are ratios, not totals.
"""
import json, pathlib, sqlite3, sys, tempfile
import duckdb
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import concentration
R = pathlib.Path(__file__).resolve().parents[1]


def build(root=R, out=None):
    root = pathlib.Path(root); out = pathlib.Path(out or root / 'data/atlas'); out.mkdir(parents=True, exist_ok=True)
    d = duckdb.connect(); d.execute("SET memory_limit='1GB'"); d.execute('SET threads=2')
    cur = d.execute("SELECT id, epoch(time)::BIGINT, title, url, score, descendants, regexp_extract(lower(coalesce(url,'')), '^https?://(?:www\\.)?([^/:?#]+)', 1) FROM read_parquet(?)", [str(root / 'data/archive/stories-*.parquet')])
    with tempfile.TemporaryDirectory() as t:
        db = sqlite3.connect(pathlib.Path(t) / 'a.db')
        db.execute("CREATE TABLE items (id INTEGER PRIMARY KEY, type TEXT, author TEXT, time INTEGER, title TEXT, url TEXT, domain TEXT, score INTEGER, comments INTEGER, text TEXT, dead INTEGER, deleted INTEGER)")
        while True:
            rows = cur.fetchmany(100000)
            if not rows: break
            db.executemany("INSERT INTO items VALUES (?, 'story', NULL, ?, ?, ?, NULLIF(?, ''), ?, ?, NULL, 0, 0)", [(r[0], r[1], r[2], r[3], r[6], r[4], r[5]) for r in rows])
        db.commit()
        lo, hi = db.execute('SELECT min(time), max(time) FROM items').fetchone()
        c = concentration.compute(db)
        c['top_posts'] = [dict(zip(['id', 'title', 'url', 'score', 'descendants', 'time'], r)) for r in db.execute("SELECT id,title,url,score,comments,time FROM items WHERE score IS NOT NULL ORDER BY score DESC,time DESC,id DESC LIMIT 30")]
    c['basis']['scope'] = 'every story in data/archive, stories only; no comments and no author names in the archive; scores as saved at fetch time'
    c['range_utc'] = [lo, hi]
    p = out / 'concentration.json'; p.write_text(json.dumps(c, separators=(',', ':')))
    return c, p


if __name__ == '__main__':
    c, p = build(); print(c['totals'], p.stat().st_size, 'bytes')
