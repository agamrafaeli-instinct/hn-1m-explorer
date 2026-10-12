#!/usr/bin/env python3
"""Second copy of the saved weeks (#220).

  python scripts/archive_weekly.py build OUT.tar.gz    pack data/weekly into a tar.gz with a MANIFEST.json of sha256 hashes
  python scripts/archive_weekly.py compare ARCHIVE     compare an archive with data/weekly/hashes.json, exit 1 on any difference
  python scripts/archive_weekly.py restore ARCHIVE WEEK   put one week back from an archive (only if missing here, never overwrites)
"""
import hashlib, io, json, pathlib, sys, tarfile

W = pathlib.Path('data/weekly')

def sha(b): return hashlib.sha256(b).hexdigest()

def build(out):
    names = sorted(p.name for p in W.glob('????-W??.json'))
    man = {'algorithm': 'sha256', 'files': {n: sha((W / n).read_bytes()) for n in names}}
    with tarfile.open(out, 'w:gz') as t:
        for n in names: t.add(W / n, arcname='weekly/' + n)
        t.add(W / 'hashes.json', arcname='weekly/hashes.json') if (W / 'hashes.json').exists() else None
        b = (json.dumps(man, indent=1) + '\n').encode(); i = tarfile.TarInfo('MANIFEST.json'); i.size = len(b); t.addfile(i, io.BytesIO(b))
    print(f'packed {len(names)} weeks into {out}')

def read(archive):
    with tarfile.open(archive) as t:
        man = json.load(t.extractfile('MANIFEST.json'))
        data = {m.name.split('/')[-1]: t.extractfile(m).read() for m in t.getmembers() if m.name.startswith('weekly/') and m.isfile()}
    return man, data

def compare(archive):
    man, data = read(archive); rec = json.loads((W / 'hashes.json').read_text())['files']; bad = []
    for f, h in sorted(rec.items()):
        if f not in man['files']: bad.append(f'Not in archive: {f}')
        elif man['files'][f] != h: bad.append(f'Archive differs from recorded hash: {f}')
        elif sha(data[f]) != h: bad.append(f'Archive file is damaged: {f}')
    print('\n'.join(bad) or f'Archive matches all {len(rec)} recorded weeks.'); return 1 if bad else 0

def restore(archive, week):
    man, data = read(archive); f = week + '.json'
    if f not in data: print('Week not in archive: ' + week); return 1
    if (W / f).exists(): print(f + ' already exists here. Saved weeks are never overwritten.'); return 1
    if sha(data[f]) != man['files'][f]: print('Archive copy is damaged.'); return 1
    (W / f).write_bytes(data[f]); print('Restored ' + f); return 0

if __name__ == '__main__':
    a = sys.argv[1:]
    try:
        sys.exit({'build': lambda: build(a[1]) or 0, 'compare': lambda: compare(a[1]), 'restore': lambda: restore(a[1], a[2])}[a[0]]())
    except (KeyError, IndexError): print(__doc__); sys.exit(2)
