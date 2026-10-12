#!/usr/bin/env python3
"""Incremental build graph for the daily run (#252). A check step names the files it depends on; if their hash equals the one saved
after its last good run, the daily run skips it. The weekly full run (and any manual run) runs every step and so catches drift.
  build_graph.py check STEP    exit 0 when STEP's inputs are unchanged since the last good run (skip it)
  build_graph.py record STEP   save the current hash after STEP passed
  build_graph.py show          print every step and its state
State: data/build_state.json (committed by the workflow). Inputs are the published site files (the allowlist in stage_site.py, cards, stories,
vendor, assets) and each step's own script. Live data under data/ is not an input here: the data checks run on every daily run, and the
weekly full run runs the UI check and perf budgets on whatever the data grew into."""
import hashlib, json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
STATE = 'data/build_state.json'
SITE_EXT = ('.html', '.js', '.mjs', '.css', '.json', '.svg', '.png', '.jpg')
SITE_DIRS = ('hypotheses/', 'stories/', 'vendor/', 'assets/')
SITE_SCRIPTS = ('scripts/stage_site.py', 'scripts/build_share_pages.py', 'scripts/build_hyp_bundle.js')
STEPS = {
    'ui': {'extra': ('tests/ui.test.mjs',)},
    'budgets': {'extra': ('scripts/perf.mjs', 'data/budgets.json')},
}


def tracked(root):
    return subprocess.run(['git', 'ls-files', '-z'], cwd=root, capture_output=True, check=True).stdout.decode().split('\0')


def inputs(step, root=ROOT):
    extra = STEPS[step]['extra']; out = []
    for f in tracked(root):
        if not f or not (pathlib.Path(root) / f).is_file(): continue
        site = ('/' not in f and f.endswith(SITE_EXT) and f != 'source.json') or f.startswith(SITE_DIRS) or f in SITE_SCRIPTS
        if site or f in extra: out.append(f)
    return sorted(out)


def digest(step, root=ROOT):
    h = hashlib.sha256(step.encode())
    for f in inputs(step, root):
        h.update(f.encode() + b'\0' + (pathlib.Path(root) / f).read_bytes() + b'\0')
    return h.hexdigest()


def load(root=ROOT):
    p = pathlib.Path(root) / STATE
    return json.loads(p.read_text()) if p.is_file() else {}


def unchanged(step, root=ROOT):
    return load(root).get(step) == digest(step, root)


def record(step, root=ROOT):
    s = load(root); s[step] = digest(step, root)
    (pathlib.Path(root) / STATE).write_text(json.dumps(s, indent=1, sort_keys=True) + '\n')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'show'
    if cmd == 'show':
        for s in STEPS: print(s, 'unchanged (skip)' if unchanged(s) else 'changed or no saved hash (run)', len(inputs(s)), 'input files')
    elif cmd in ('check', 'record') and len(sys.argv) > 2 and sys.argv[2] in STEPS:
        if cmd == 'record': record(sys.argv[2]); print('recorded', sys.argv[2])
        else:
            ok = unchanged(sys.argv[2]); print(sys.argv[2], 'inputs unchanged since the last good run: skip' if ok else 'inputs changed or no saved hash: run'); sys.exit(0 if ok else 1)
    else:
        print(__doc__); sys.exit(2)
