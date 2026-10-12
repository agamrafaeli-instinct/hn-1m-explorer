#!/usr/bin/env python3
"""Digest of every tracked and new (not ignored) file except the marker, so prepush can say "these exact files passed".
  python3 scripts/prepush_digest.py --write   write the digest to .prepush_ok (prepush does this on success)
  python3 scripts/prepush_digest.py --check   exit 0 only if .prepush_ok matches the current files
Missing or stale marker means "run every check"."""
import hashlib, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
MARK = '.prepush_ok'


def digest(root=ROOT):
    files = subprocess.run(['git', 'ls-files', '-c', '-o', '--exclude-standard', '-z'], cwd=root, capture_output=True,
                           check=True).stdout.decode().split('\0')
    h = hashlib.sha256()
    for f in sorted(x for x in files if x and x != MARK and (pathlib.Path(root) / x).is_file()):
        blob = subprocess.run(['git', 'hash-object', f], cwd=root, capture_output=True, check=True).stdout.decode().strip()
        h.update(f.encode() + b'\0' + blob.encode() + b'\n')
    return h.hexdigest()


def matches(root=ROOT):
    p = pathlib.Path(root) / MARK
    return p.is_file() and p.read_text().strip() == digest(root)


if __name__ == '__main__':
    if '--write' in sys.argv:
        (ROOT / MARK).write_text(digest() + '\n')
        print('prepush marker written')
    elif '--check' in sys.argv:
        ok = matches()
        print('prepush marker matches: skip repeat checks' if ok else 'no matching prepush marker: run every check')
        sys.exit(0 if ok else 1)
    else:
        print(digest())
