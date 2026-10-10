#!/usr/bin/env python3
"""Build the public story-only Parquet file for one older year (Atlas Slice 1) and list it in data/archive/manifest.json.

  python scripts/build_story_file.py --year 2007

Needs `pip install duckdb` (build time only, not part of the daily run). Source: the Hugging Face dataset
open-index/hacker-news, monthly files. Only story rows are kept (type 1), and only live ones (not deleted, not dead).
Columns: type, id, time, title, url, score, descendants. No comment text, no author names, no story body text.
Output: data/archive/stories-<year>.parquet, sorted by id. The manifest entry has name, rows, first_id, last_id,
sha256 and bytes. Rebuilding the same year replaces its entry."""
import argparse, hashlib, json, pathlib, urllib.request
import duckdb

SRC = 'https://huggingface.co/datasets/open-index/hacker-news/resolve/main/data/{y}/{y}-{m:02d}.parquet'
COLS = ['type', 'id', 'time', 'title', 'url', 'score', 'descendants']

def build(root, year):
    root = pathlib.Path(root); out = root / 'data' / 'archive' / f'stories-{year}.parquet'
    d = duckdb.connect(); d.sql('install httpfs; load httpfs')
    tree = json.load(urllib.request.urlopen(f'https://huggingface.co/api/datasets/open-index/hacker-news/tree/main/data/{year}'))
    urls = [SRC.format(y=year, m=int(f['path'][-10:-8])) for f in sorted(tree, key=lambda f: f['path']) if f['path'].endswith('.parquet')]
    assert urls, f'no monthly files for {year}'
    d.sql(f"copy (select {', '.join(COLS)} from read_parquet({urls!r}) where type = 1 and coalesce(deleted, 0) = 0 and coalesce(dead, 0) = 0 "
          f"order by id) to '{out}' (format parquet, compression zstd, compression_level 19, row_group_size 10000)")
    rows, lo, hi, bad = d.sql(f"select count(*), min(id), max(id), sum((title is null or title = '')::int) from read_parquet('{out}')").fetchone()
    cols = [r[0] for r in d.sql(f"describe select * from read_parquet('{out}')").fetchall()]
    assert cols == COLS, cols
    assert rows and not bad, f'{bad} rows without a title'
    entry = {'name': out.name, 'rows': rows, 'first_id': lo, 'last_id': hi, 'sha256': hashlib.sha256(out.read_bytes()).hexdigest(),
             'bytes': out.stat().st_size, 'kind': 'stories', 'year': int(year), 'columns': COLS,
             'source': 'huggingface.co/datasets/open-index/hacker-news', 'note': 'Live stories only. No comment text, no author names.'}
    mp = root / 'data' / 'archive' / 'manifest.json'; m = json.loads(mp.read_text())
    m['files'] = sorted([f for f in m['files'] if f['name'] != out.name] + [entry], key=lambda f: f['first_id'])
    m['note'] = 'One entry per archive file. Files held on Pages sit in this folder. Fields: name, rows, first_id, last_id, sha256, bytes.'
    mp.write_text(json.dumps(m, indent=1) + '\n'); return entry

if __name__ == '__main__':
    a = argparse.ArgumentParser(); a.add_argument('--root', default='.'); a.add_argument('--year', required=True)
    x = a.parse_args(); print(json.dumps(build(x.root, x.year), indent=1))
