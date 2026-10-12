#!/usr/bin/env python3
"""Strict data contract for the daily run (#253). Compares the data the run just built with the last good commit and lists every break.
  python3 scripts/contract.py [--base HEAD] [--root .]     exit 1 if any rule is broken; prints one line per break
Rules (a break means the day is quarantined, never saved):
  1  the rolling window keeps its size: total_rows equals the base total_rows and retention_rows
  2  the chunk row counts add up to total_rows
  3  the scan never goes backward: last_scanned_id and the highest chunk id are not lower than in the base
  4  new_rows is a whole number from 0 to 200000
  5  no archive file disappears and none loses rows (the archive only grows)
  6  no chunk path is listed twice
A run with 0 new rows is allowed (a warning on stdout, not a break)."""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
MAX_NEW = 200000


def base_json(ref, path, root):
    r = subprocess.run(['git', 'show', '%s:%s' % (ref, path)], cwd=root, capture_output=True, text=True)
    return json.loads(r.stdout) if r.returncode == 0 else None


def check(new, old, new_arch=None, old_arch=None):
    """Returns (breaks, warnings). new/old are data/manifest.json contents; arch are data/archive/manifest.json contents."""
    bad, warn = [], []
    du = new.get('daily_update', {})
    chunks = new.get('chunks', [])
    if new.get('total_rows') != du.get('retention_rows', new.get('total_rows')):
        bad.append('1 total_rows %s differs from retention_rows %s' % (new.get('total_rows'), du.get('retention_rows')))
    if old and new.get('total_rows') != old.get('total_rows'):
        bad.append('1 total_rows changed from %s to %s' % (old.get('total_rows'), new.get('total_rows')))
    s = sum(c.get('rows', 0) for c in chunks)
    if s != new.get('total_rows'):
        bad.append('2 chunk rows add up to %s, total_rows says %s' % (s, new.get('total_rows')))
    if old:
        od = old.get('daily_update', {})
        if du.get('last_scanned_id', 0) < od.get('last_scanned_id', 0):
            bad.append('3 last_scanned_id went back from %s to %s' % (od.get('last_scanned_id'), du.get('last_scanned_id')))
        mx = lambda m: max([c.get('max_id', 0) for c in m.get('chunks', [])] or [0])
        if mx(new) < mx(old):
            bad.append('3 highest chunk id went back from %s to %s' % (mx(old), mx(new)))
    n = du.get('new_rows')
    if not isinstance(n, int) or n < 0 or n > MAX_NEW:
        bad.append('4 new_rows is %r, wanted a whole number from 0 to %d' % (n, MAX_NEW))
    elif n == 0:
        warn.append('new_rows is 0 (no new items this run)')
    paths = [c.get('path') for c in chunks]
    if len(paths) != len(set(paths)):
        bad.append('6 a chunk path is listed twice')
    if new_arch is not None and old_arch is not None:
        nf = {f['name']: f for f in new_arch.get('files', [])}
        for f in old_arch.get('files', []):
            if f['name'] not in nf:
                bad.append('5 archive file %s disappeared' % f['name'])
            elif nf[f['name']].get('rows', 0) < f.get('rows', 0):
                bad.append('5 archive file %s lost rows: %s to %s' % (f['name'], f.get('rows'), nf[f['name']].get('rows')))
    return bad, warn


def main():
    ref = sys.argv[sys.argv.index('--base') + 1] if '--base' in sys.argv else 'HEAD'
    root = pathlib.Path(sys.argv[sys.argv.index('--root') + 1]) if '--root' in sys.argv else ROOT
    new = json.loads((root / 'data/manifest.json').read_text()); old = base_json(ref, 'data/manifest.json', root)
    na = json.loads((root / 'data/archive/manifest.json').read_text()); oa = base_json(ref, 'data/archive/manifest.json', root)
    bad, warn = check(new, old, na, oa)
    for w in warn: print('warning:', w)
    for b in bad: print('BREAK', b)
    print('data contract:', 'broken (%d)' % len(bad) if bad else 'ok')
    sys.exit(1 if bad else 0)


if __name__ == '__main__': main()
