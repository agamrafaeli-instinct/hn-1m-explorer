#!/usr/bin/env python3
"""One-off: add the "terms" section to data/summary.json from the CSV chunks (daily updates do this on their own)."""
import csv, glob, json, os, pathlib, sqlite3, sys, tempfile
sys.path.insert(0, os.path.dirname(__file__))
from terms import compute
csv.field_size_limit(10**9)
root = pathlib.Path(__file__).resolve().parent.parent / 'data'
with tempfile.TemporaryDirectory() as tmp:
    db = sqlite3.connect(os.path.join(tmp, 'i.db'))
    db.execute('CREATE TABLE items(id INTEGER PRIMARY KEY,type TEXT,time INTEGER,title TEXT,score INTEGER,dead INTEGER,deleted INTEGER)')
    for f in sorted(glob.glob(str(root / 'posts-*.csv'))):
        with open(f, newline='', encoding='utf-8') as fh:
            db.executemany('INSERT OR REPLACE INTO items VALUES(?,?,?,?,?,?,?)', ((int(x['id']), x['type'], int(x['time']) if x['time'] else None, x['title'], int(x['score']) if x['score'] else None, int(x['dead'] or 0), int(x['deleted'] or 0)) for x in csv.DictReader(fh)))
    out = compute(db)
p = root / 'summary.json'; s = json.loads(p.read_text()); s['terms'] = out
p.write_text(json.dumps(s, indent=2))
print('weeks:', len(out['weekly']))
