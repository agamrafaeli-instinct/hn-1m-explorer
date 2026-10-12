#!/usr/bin/env python3
"""Hash of everything the film shares, topic series, rings and saga steps read (#243), so the daily run can skip them
when nothing changed since the last run. Output files stay identical because the steps are deterministic.
  inputs_hash.py --check   exit 0 only if data/film_inputs.sha matches the current inputs (skip the steps)
  inputs_hash.py --write   store the current hash (run after the steps)
The UTC year-month is part of the hash because film.py drops a partial last month. A missing or old file runs the steps."""
import hashlib, datetime, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
STORE = 'data/film_inputs.sha'
INPUTS = ['data/archive', 'data/history/daily.csv', 'data/atlas/months.json', 'data/atlas',
          'scripts/film.py', 'scripts/build_topic_series.py', 'scripts/rings_data.py', 'scripts/saga_data.py', 'scripts/terms.py',
          'scripts/inputs_hash.py']
OUTPUTS = {'data/film_shares.json', 'data/topic_series.json', 'data/rings.json', 'data/saga.json'}


def files(root):
    out = set()
    for p in INPUTS:
        q = pathlib.Path(root) / p
        if q.is_dir():
            out |= {f for f in q.rglob('*') if f.is_file()}
        elif q.is_file():
            out.add(q)
    return sorted(out)


def digest(root=ROOT, month=None):
    month = month or datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m')
    h = hashlib.sha256(month.encode())
    for f in files(root):
        h.update(str(f.relative_to(root)).encode() + b'\0')
        with open(f, 'rb') as fh:
            for chunk in iter(lambda: fh.read(1 << 20), b''):
                h.update(chunk)
    return h.hexdigest()


def matches(root=ROOT, month=None):
    s = pathlib.Path(root) / STORE
    return s.is_file() and s.read_text().strip() == digest(root, month) and all((pathlib.Path(root) / o).is_file() for o in OUTPUTS)


if __name__ == '__main__':
    if '--write' in sys.argv:
        (ROOT / STORE).write_text(digest() + '\n'); print('inputs hash written')
    elif '--check' in sys.argv:
        ok = matches(); print('inputs unchanged since the last run: skip' if ok else 'inputs changed or no stored hash: run the steps'); sys.exit(0 if ok else 1)
    else:
        print(digest())
