#!/usr/bin/env python3
"""Fixed data for the UI check (#336).
  python3 scripts/make_ui_fixture.py            rebuild tests/fixtures/ui/data from the live data folder
  python3 scripts/make_ui_fixture.py --stage D  stage the site code into D with data/ replaced by that fixture
The fixture keeps every small data file as it is (weeks, lenses, cards data, history) and swaps the explorer's 186 big CSV chunks for 4 small ones
(every 25th row of the four biggest), with a manifest to match. Of the atlas only its summary files, the word list for "r" and the yearly tops stay; the archive is left out. The check then does not move when a new week or day lands.
Rebuild only to change what the UI check sees. The daily run still checks the live data (see UI check in daily-hn.yml)."""
import argparse, csv, json, pathlib, shutil, subprocess, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
FIX = ROOT / 'tests/fixtures/ui/data'
SKIP = ('archive', 'atlas', 'build_state.json')
ATLAS = ('months.json', 'concentration.json', 'index.json', 'terms-r.json')

def build():
    if FIX.exists(): shutil.rmtree(FIX)
    FIX.mkdir(parents=True)
    for p in sorted((ROOT / 'data').iterdir()):
        if p.name in SKIP or p.name.startswith('posts-') or p.name == 'manifest.json': continue
        if p.is_dir(): shutil.copytree(p, FIX / p.name, ignore=shutil.ignore_patterns('__pycache__'))
        else: shutil.copy2(p, FIX / p.name)
    (FIX / 'atlas').mkdir()
    for n in [*ATLAS, *sorted(x.name for x in (ROOT / 'data/atlas').glob('tops-*.json'))]: shutil.copy2(ROOT / 'data/atlas' / n, FIX / 'atlas' / n)
    m = json.load(open(ROOT / 'data/manifest.json')); out = []; total = 0
    big = sorted(sorted(range(len(m['chunks'])), key=lambda i: -m['chunks'][i]['rows'])[:4])
    for i, c in enumerate(m['chunks'][j] for j in big):
        rows = list(csv.reader(open(ROOT / c['path'], newline='', encoding='utf-8')))
        keep = [rows[0]] + rows[1::25]; name = 'data/posts-%05d.csv' % (i + 1)
        with open(FIX.parent / name, 'w', newline='', encoding='utf-8') as f: csv.writer(f, lineterminator='\r\n').writerows(keep)
        n = len(keep) - 1; total += n; ids = [int(r[0]) for r in keep[1:]]; ts = [int(r[3]) for r in keep[1:] if r[3]]
        out.append({'path': name, 'rows': n, 'bytes': (FIX.parent / name).stat().st_size, 'min_id': min(ids), 'max_id': max(ids), 'min_time': min(ts), 'max_time': max(ts)})
    m['chunks'] = out; m['total_rows'] = total; m['total_csv_bytes'] = sum(c['bytes'] for c in out)
    json.dump(m, open(FIX / 'manifest.json', 'w'), indent=1)
    for c in out: shutil.move(str(FIX.parent / c['path']), str(FIX / pathlib.Path(c['path']).name))
    print('ui fixture:', total, 'rows in', len(out), 'chunks;', sum(f.stat().st_size for f in FIX.rglob('*') if f.is_file()) // 1024, 'KB')

def stage(dest):
    # stage the site code only, then put the fixture in place of data/
    sys.path.insert(0, str(ROOT / 'scripts')); import stage_site
    stage_site.stage(ROOT, dest)
    d = pathlib.Path(dest) / 'data'; shutil.rmtree(d); shutil.copytree(FIX, d)

if __name__ == '__main__':
    a = argparse.ArgumentParser(); a.add_argument('--stage'); x = a.parse_args()
    stage(x.stage) if x.stage else build()
