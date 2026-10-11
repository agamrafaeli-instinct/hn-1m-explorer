#!/usr/bin/env python3
"""Keep stories that leave the rolling window (docs/BACKFILL_PLAN.md, slice 6).

stage(root, rows, staged_dir) writes the updated story files and manifest into staged_dir and
returns the names it staged. It never touches data/archive. The caller moves the staged files in
only after everything else for the run is ready, so a failure leaves the archive as it was.
Rows already in the archive are skipped by id, so a rerun adds nothing twice.
rows: (id, unix_time, title, url, score, comments) for stories only.
"""
import datetime as dt, hashlib, json, pathlib


def stage(root, rows, staged_dir):
    root = pathlib.Path(root); arch = root / 'data/archive'; mp = arch / 'manifest.json'
    if not rows or not mp.exists(): return []
    import duckdb
    man = json.loads(mp.read_text()); files = {f['name']: f for f in man['files']}
    by_year = {}
    for r in rows:
        by_year.setdefault(dt.datetime.fromtimestamp(r[1], dt.timezone.utc).year, []).append(r)
    out = pathlib.Path(staged_dir); out.mkdir(parents=True, exist_ok=True); added = 0; staged = []
    for year, items in sorted(by_year.items()):
        name = 'stories-%d.parquet' % year; path = arch / name
        db = duckdb.connect()
        db.execute('CREATE TABLE s (type TINYINT, id UINTEGER, time TIMESTAMPTZ, title VARCHAR, url VARCHAR, score INTEGER, descendants INTEGER)')
        if path.exists(): db.execute("INSERT INTO s SELECT type,id,time,title,url,score,descendants FROM read_parquet(?)", [str(path)])
        have = {x[0] for x in db.execute('SELECT id FROM s').fetchall()}
        new = [r for r in items if r[0] not in have]
        if not new: continue
        db.executemany("INSERT INTO s VALUES (1,?,to_timestamp(?),?,?,?,?)", [(r[0], r[1], r[2], r[3], r[4], r[5]) for r in new])
        tmp = out / name
        db.execute("COPY (SELECT * FROM s ORDER BY id) TO '%s' (FORMAT PARQUET, COMPRESSION ZSTD, ROW_GROUP_SIZE 10240)" % str(tmp).replace("'", "''"))
        n, lo, hi = db.execute('SELECT count(*),min(id),max(id) FROM s').fetchone()
        data = tmp.read_bytes()
        e = files.get(name) or {'name': name, 'kind': 'stories', 'year': year,
            'columns': ['type', 'id', 'time', 'title', 'url', 'score', 'descendants'],
            'source': 'daily run, items leaving the rolling window', 'note': 'Live stories only. No comment text, no author names.'}
        e.update(rows=n, first_id=lo, last_id=hi, sha256=hashlib.sha256(data).hexdigest(), bytes=len(data))
        files[name] = e; added += len(new); staged.append(name)
    if not staged: return []
    man['files'] = sorted(files.values(), key=lambda f: f['name'])
    (out / 'manifest.json').write_text(json.dumps(man, indent=1) + '\n')
    return staged + ['manifest.json']
