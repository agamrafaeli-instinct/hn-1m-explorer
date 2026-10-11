#!/usr/bin/env python3
"""Draft weekly findings from the flags in data/compare/<week>.json (docs/FINDINGS_SPEC.md).

Writes data/findings/<week>.draft.json. A draft is never read by the site.
Up to 3 lines per audience, ranked by flag size. Numbers are copied from the file.
"""
import argparse, csv, datetime, glob, json, math, os, re

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


def load_log(path):
    if not os.path.exists(path): return []
    with open(path) as f: return list(csv.DictReader(f))


def flips_in_window(log, start, end):
    """Flip rule (docs/SCOREBOARD.md): the verdict word changed between two logged days.
    A confidence-only move is a shift and is not listed. start inclusive, end exclusive (ISO dates)."""
    by = {}
    for r in sorted(log, key=lambda r: (r['card_id'], r['date'])):
        by.setdefault(r['card_id'], []).append(r)
    out = []
    for card, rows in by.items():
        for a, b in zip(rows, rows[1:]):
            if a['verdict'] != b['verdict'] and start <= b['date'] < end:
                out.append({'card_id': card, 'from': a['verdict'], 'to': b['verdict'], 'date': b['date'], 'prev_date': a['date']})
    return sorted(out, key=lambda x: (x['date'], x['card_id']))


def flip_lines(week, d, log, titles):
    end = d.get('end_exclusive_utc')
    if not end: return []
    start = (datetime.date.fromisoformat(end) - datetime.timedelta(days=7)).isoformat()
    lines = []
    for f in flips_in_window(log, start, end)[:MAX_PER_AUDIENCE]:
        title = titles.get(f['card_id'], f['card_id'])
        lines.append({'text': 'Card %s changed from %s to %s on %s.' % (f['card_id'], f['from'], f['to'], f['date']),
                      'card_title': title, 'source': 'data/verdicts/log.csv', 'path': 'card_id,date', 'key': f['card_id'],
                      'source_line': 'Source: data/verdicts/log.csv, card_id %s, %s %s, %s %s.' % (f['card_id'], f['prev_date'], f['from'], f['date'], f['to'])})
    return lines


def draft_week(week, d, log=None, titles=None):
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
    return {'week': week, 'caveat': CAVEAT, 'backfill': note == 'backfill', 'audiences': out,
            'flips': flip_lines(week, d, log or [], titles or {})}


def card_titles():
    t = {}
    for f in glob.glob(os.path.join(ROOT, 'hypotheses/h*.json')):
        try: c = json.load(open(f)); t[c['id']] = c['title']
        except Exception: pass
    return t


def run(compare_dir, out_dir, log_path=os.path.join(ROOT, 'data/verdicts/log.csv')):
    os.makedirs(out_dir, exist_ok=True)
    log, titles = load_log(log_path), card_titles()
    n = 0
    for f in sorted(glob.glob(os.path.join(compare_dir, '20*-W*.json'))):
        week = os.path.basename(f)[:-5]
        res = draft_week(week, json.load(open(f)), log, titles)
        json.dump(res, open(os.path.join(out_dir, week + '.draft.json'), 'w'), indent=1, sort_keys=True)
        n += 1
    return n


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--compare', default=os.path.join(ROOT, 'data/compare'))
    ap.add_argument('--out', default=os.path.join(ROOT, 'data/findings'))
    a = ap.parse_args()
    print('drafted %d weeks' % run(a.compare, a.out))
