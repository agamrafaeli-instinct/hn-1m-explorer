#!/usr/bin/env python3
"""Copy lint (#246): rejects em dashes, "1M", "the last million" and banned filler words in text you changed.
Looks only at lines added since origin/main (committed, staged or not) and at new untracked files.
The repo name and URLs may keep their 1M. Skips data/, tests/, vendor/, this script and docs/VOICE.md (which lists the banned words).
  copy_lint.py            lint the changes; exit 1 and list each hit
  copy_lint.py --all      lint every checked-in text file (informational)"""
import re, subprocess, sys

EXT = ('.md', '.html', '.js', '.mjs', '.css', '.py', '.yml', '.txt')
SKIP = ('data/', 'tests/', 'vendor/', 'assets/', 'demo/', 'sample/', 'stories/', 'hypotheses/', 'scripts/copy_lint.py', 'docs/VOICE.md', 'docs/ESTIMATES.csv')
BANNED = [r'\bvotes\b', r'\b1M\b', r'the last million', r'\u2014', r'&mdash;', r'\bdelve\b', r'\bcrucial\b', r'\bpivotal\b',
          r'\bleverag(e|es|ing)\b', r'\bstreamline', r'\bholistic', r'\brobust\b', r'\bseamless', r'\bempower', r'\bunlock',
          r'game-changing', r"we're excited", r'in order to', r'\bsimply\b', r'\bpowerful\b', r'\bcomprehensive\b']


def clean(t):
    t = re.sub(r'https?://\S+', ' ', t)
    return re.sub(r'agamrafaeli-instinct/hn-1m-explorer|hn-1m-explorer', ' ', t)


def hits(line):
    t = clean(line)
    return [p for p in BANNED if re.search(p, t, 0 if p == r'\b1M\b' else re.I)]


def wanted(path):
    return path.endswith(EXT) and not path.startswith(SKIP)


def added_lines(base='origin/main'):
    out = subprocess.run(['git', 'diff', '-U0', base, '--'], capture_output=True, text=True, check=True).stdout
    path, res = None, []
    for ln in out.splitlines():
        if ln.startswith('+++ '):
            path = ln[6:] if ln.startswith('+++ b/') else None
        elif ln.startswith('+') and path and wanted(path):
            res.append((path, ln[1:]))
    new = subprocess.run(['git', 'ls-files', '-o', '--exclude-standard'], capture_output=True, text=True, check=True).stdout.split()
    for p in new:
        if wanted(p):
            for ln in open(p, errors='ignore').read().splitlines():
                res.append((p, ln))
    return res


def all_lines():
    files = subprocess.run(['git', 'ls-files'], capture_output=True, text=True, check=True).stdout.split()
    return [(p, ln) for p in files if wanted(p) for ln in open(p, errors='ignore').read().splitlines()]


def lint(rows):
    return [(p, ln.strip()[:100], h) for p, ln in rows for h in [hits(ln)] if h]


if __name__ == '__main__':
    bad = lint(all_lines() if '--all' in sys.argv else added_lines())
    for p, ln, h in bad:
        print(f'{p}: {", ".join(h)}: {ln}')
    print('copy lint:', len(bad), 'hit(s)')
    sys.exit(1 if bad and '--all' not in sys.argv else 0)
