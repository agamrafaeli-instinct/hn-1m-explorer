#!/usr/bin/env python3
"""Fail when data/lists.json changes without a new list_version.
data/lists_versions.json maps each version to a hash of the lists (without the version field).
Edit the lists, bump list_version, then run with --record to add the new hash."""
import hashlib, json, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent


def digest(lists):
    body = {k: v for k, v in lists.items() if k != 'list_version'}
    return hashlib.sha256(json.dumps(body, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def check(lists, locked):
    v = str(lists.get('list_version'))
    h = digest(lists)
    if v not in locked:
        return 'list_version %s has no recorded hash. Run: python3 scripts/check_list_version.py --record' % v
    if locked[v] != h:
        return 'data/lists.json changed but list_version is still %s. Bump list_version, then run --record.' % v
    return None


def main(argv):
    lp, vp = ROOT / 'data/lists.json', ROOT / 'data/lists_versions.json'
    lists = json.loads(lp.read_text())
    locked = json.loads(vp.read_text()) if vp.exists() else {}
    if '--record' in argv:
        v = str(lists['list_version'])
        if v in locked and locked[v] != digest(lists):
            print('Version %s is already recorded with different lists. Bump list_version first.' % v); return 1
        locked[v] = digest(lists); vp.write_text(json.dumps(locked, indent=1, sort_keys=True) + '\n'); print('recorded', v); return 0
    err = check(lists, locked)
    print(err or 'ok list_version %s matches its lists' % lists['list_version'])
    return 1 if err else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
