#!/usr/bin/env python3
"""Draft weekly findings from the flags in data/compare/<week>.json (docs/FINDINGS_SPEC.md).

Writes data/findings/<week>.draft.json. A draft is never read by the site.
Up to 3 lines per audience, ranked by flag size. Numbers are copied from the file.
"""
import argparse, glob, json, math, os, re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
AUDIENCES = ('engineers', 'vcs', 'geeks')
MAX_PER_AUDIENCE = 3
MAX_WORDS = 25
QUIET = 'No big changes this week.'
CAVEAT = 'Hacker News talking, not a measure of what is true.'
BANNED = ('boom', 'surge', 'crash', 'soar', 'plunge', 'skyrocket', 'explode')


def num(x):
    return ('%g' % x)


def pct(x):
    return '%s%%' % num(round(x * 100, 1))


def count_line(kind, it):
    word = 'about %s expected from last week' % num(it['expected'])
    verb = {'rose': 'appeared in', 'fell': 'appeared in'}[kind]
    return '%s %s %s story titles and texts this week, against %s.' % (it['label'], verb, num(it['this']), word)


def share_line(it):
    return '%s was %s this week, against a 4-week average of %s.' % (it['label'], pct(it['this']), pct(it['avg4']))


def new_line(it):
    return '%s is new this week, in %s story titles and texts.' % (it['label'], num(it['this']))


def draft_week(week, d):
    out = {}
    for aud in AUDIENCES:
        a = d['audiences'].get(aud, {})
        cands = []
        for kind in ('rose', 'fell'):
            for it in a.get(kind, []):
                size = abs(it['diff']) / math.sqrt(it['expected']) if it.get('expected') else 0
                cands.append((size, count_line(kind, it), 'audiences.%s.%s' % (aud, kind), it['key'],
                              'this %s, expected %s' % (num(it['this']), num(it['expected']))))
        for it in a.get('shares', []):
            if it.get('state') and it['state'] != 'steady' and it.get('usual_change'):
                size = abs(it['this'] - it['last']) / it['usual_change']
                cands.append((size, share_line(it), 'audiences.%s.shares' % aud, it['key'],
                              'this %s, avg4 %s' % (num(it['this']), num(it['avg4']))))
        for it in a.get('new', []):
            cands.append((1e6 + it.get('this', 0), new_line(it), 'audiences.%s.new' % aud, it['key'],
                          'this %s' % num(it['this'])))
        cands.sort(key=lambda c: (-c[0], c[3]))
        lines = []
        for size, text, path, key, nums in cands[:MAX_PER_AUDIENCE]:
            lines.append({'text': text, 'source': 'data/compare/%s.json' % week, 'path': path, 'key': key,
                          'source_line': 'Source: data/compare/%s.json, %s, key "%s" (%s).' % (week, path, key, nums),
                          'size': round(size, 2)})
        out[aud] = lines or [{'text': QUIET, 'quiet': True}]
    note = 'backfill' if d.get('kind') == 'backfill' else None
    return {'week': week, 'caveat': CAVEAT, 'backfill': note == 'backfill', 'audiences': out}


def run(compare_dir, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    n = 0
    for f in sorted(glob.glob(os.path.join(compare_dir, '20*-W*.json'))):
        week = os.path.basename(f)[:-5]
        res = draft_week(week, json.load(open(f)))
        json.dump(res, open(os.path.join(out_dir, week + '.draft.json'), 'w'), indent=1, sort_keys=True)
        n += 1
    return n


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--compare', default=os.path.join(ROOT, 'data/compare'))
    ap.add_argument('--out', default=os.path.join(ROOT, 'data/findings'))
    a = ap.parse_args()
    print('drafted %d weeks' % run(a.compare, a.out))
