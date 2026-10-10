#!/usr/bin/env python3
"""Stage public assets by a conservative allowlist, never publish tooling or history."""
import argparse, pathlib, shutil
SUFFIXES={'.html','.js','.mjs','.css','.json','.svg','.png','.jpg','.jpeg','.gif','.webp','.ico','.avif','.woff','.woff2','.ttf','.otf','.mp4','.webm','.ogg','.mp3','.wav','.pdf','.txt','.xml','.webmanifest'}
DIRECTORIES={'data','vendor','sample','assets','images','fonts','media','css','js','hypotheses','stories'}
MAX_BYTES=900_000_000

def stage(root,destination):
    root=pathlib.Path(root).resolve(); destination=pathlib.Path(destination).resolve()
    if destination.exists(): raise ValueError('Staging destination must be fresh')
    if destination==root or destination in root.parents: raise ValueError('Unsafe staging destination')
    selected=[]
    for p in sorted(root.iterdir()):
        if p.name in DIRECTORIES or p.name=='.nojekyll' or (p.is_file() and p.suffix.lower() in SUFFIXES and p.name!='source.json'):
            if p.is_symlink(): raise ValueError('Symlink cannot be published: '+p.name)
            selected.append(p)
    names={p.name for p in selected}
    if 'index.html' not in names or 'data' not in names or not (root/'data/manifest.json').is_file():
        raise ValueError('Missing index.html or real dataset manifest')
    size=0
    for p in selected:
        entries=list(p.rglob('*')) if p.is_dir() else [p]
        for item in entries:
            if item.is_symlink(): raise ValueError('Symlink cannot be published: '+str(item))
            if item.is_file(): size+=item.stat().st_size
    if size>=MAX_BYTES: raise ValueError('Pages safety limit exceeded')
    destination.mkdir(parents=True)
    for p in selected:
        if p.is_dir(): shutil.copytree(p,destination/p.name)
        else: shutil.copy2(p,destination/p.name)
    hd=destination/'hypotheses'
    if hd.is_dir():  # index.json is generated, so cards never conflict on it
        import json
        (hd/'index.json').write_text(json.dumps(sorted(f.stem for f in hd.glob('*.json') if f.name!='index.json')))
        import subprocess
        try: subprocess.run(['node',str(root/'scripts/build_hyp_bundle.js'),str(destination)],check=True,timeout=120)
        except Exception as e:
            print('bundle step skipped:',e)
            for f in ('bundle.json','tally.json'): (hd/f).unlink(missing_ok=True)
    print('Published bytes:',size,'; assets:',', '.join(sorted(names)))
    return size

if __name__=='__main__':
    a=argparse.ArgumentParser(description=__doc__); a.add_argument('--root',default='.'); a.add_argument('--output',default='_site')
    args=a.parse_args(); stage(args.root,args.output)
