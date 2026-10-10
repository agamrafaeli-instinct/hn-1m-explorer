#!/usr/bin/env python3
"""Check saved weekly files against data/weekly/hashes.json.

  python scripts/verify_weekly.py             fail if a saved week changed, is missing, or is not recorded yet
  python scripts/verify_weekly.py --add-new   record the hash of weeks that are not recorded yet, then check the rest
  python scripts/verify_weekly.py --init      write the first hash list from the files that exist now (only if no list exists)

A recorded hash is never changed by this script. To accept a deliberate replacement (a backfill file rebuilt with
a newer schema), a person edits hashes.json in the same commit and says why in the commit message.
Exit code 0 when everything matches, 1 otherwise. Messages say what to do next."""
import argparse, hashlib, json, pathlib, sys

def sha(p): return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()

def files(d): return sorted(p.name for p in pathlib.Path(d).glob('????-W??.json'))

def verify(root, add_new=False, init=False):
    d = pathlib.Path(root) / 'data' / 'weekly'; hp = d / 'hashes.json'
    have = files(d); msgs = []
    if init:
        if hp.exists(): return 1, ['hashes.json already exists. Use --add-new to record new weeks.']
        hp.write_text(json.dumps({'algorithm': 'sha256', 'files': {f: sha(d / f) for f in have}}, indent=1) + '\n')
        return 0, [f'Recorded {len(have)} weeks.']
    if not hp.exists(): return 1, ['data/weekly/hashes.json is missing. Run: python scripts/verify_weekly.py --init']
    rec = json.loads(hp.read_text()); fl = rec.get('files', {})
    for f, h in sorted(fl.items()):
        if f not in have: msgs.append(f'Missing saved week: {f}. Restore it from git history.')
        elif sha(d / f) != h: msgs.append(f'Changed saved week: {f}. Restore it from git history. Saved weeks are never edited.')
    new = [f for f in have if f not in fl]
    if new and add_new:
        for f in new: fl[f] = sha(d / f)
        rec['files'] = dict(sorted(fl.items())); hp.write_text(json.dumps(rec, indent=1) + '\n')
        msgs.append('Recorded new weeks: ' + ', '.join(new))
    elif new: msgs.append('Not recorded yet: ' + ', '.join(new) + '. Run with --add-new.')
    bad = [m for m in msgs if m.startswith(('Missing', 'Changed', 'Not recorded'))]
    return (1 if bad else 0), (msgs or [f'All {len(fl)} saved weeks match.'])

if __name__ == '__main__':
    a = argparse.ArgumentParser(); a.add_argument('--root', default='.'); a.add_argument('--add-new', action='store_true'); a.add_argument('--init', action='store_true')
    x = a.parse_args(); code, out = verify(x.root, x.add_new, x.init); print('\n'.join(out)); sys.exit(code)
