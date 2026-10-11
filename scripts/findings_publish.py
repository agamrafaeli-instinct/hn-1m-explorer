#!/usr/bin/env python3
"""Check weekly finding drafts against their sources and publish the lines that pass (docs/FINDINGS_SPEC.md).

Reads data/findings/<week>.draft.json, writes data/findings/<week>.json. A saved week is never overwritten.
A line is dropped unless its text is exactly what the source numbers produce, it has 25 words or fewer,
uses no banned word, and its source line names a key that exists in the source file.
"""
import argparse, datetime, glob, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import findings_draft as fd

ROOT = os.path.join(HERE, '..')


def lookup(d, path, key):
    node = d
    for p in path.split('.'):
        node = node[p]
    hits = [x for x in node if x.get('key') == key]
    return hits[0] if len(hits) == 1 else None


def expected_text(path, it):
    kind = path.rsplit('.', 1)[-1]
    if kind in ('rose', 'fell'): return fd.count_line(kind, it)
    if kind == 'shares': return fd.share_line(it)
    if kind == 'new': return fd.new_line(it)
    return None


def line_ok(week, compare, log, ln):
    """Return (ok, reason)."""
    text = ln.get('text', '')
    if len(text.split()) > fd.MAX_WORDS: return False, 'over %d words' % fd.MAX_WORDS
    if any(w in text.lower() for w in fd.BANNED): return False, 'banned word'
    if not ln.get('source_line', '').startswith('Source: ') or ln.get('key', '') not in ln['source_line']: return False, 'source line'
    if ln.get('source') == 'data/verdicts/log.csv':
        rows = [r for r in log if r['card_id'] == ln['key']]
        for a, b in zip(rows, rows[1:]):
            if a['verdict'] != b['verdict'] and 'Card %s changed from %s to %s on %s.' % (ln['key'], a['verdict'], b['verdict'], b['date']) == text:
                return True, ''
        return False, 'flip not in log'
    if ln.get('source') != 'data/compare/%s.json' % week: return False, 'wrong source file'
    try: it = lookup(compare, ln['path'], ln['key'])
    except (KeyError, TypeError): return False, 'path'
    if not it: return False, 'key missing'
    if expected_text(ln['path'], it) != text: return False, 'numbers differ from source'
    return True, ''


def publish_week(draft, compare, log, today):
    week = draft['week']
    out_aud, dropped = {}, []
    for aud, lines in draft['audiences'].items():
        good = []
        for ln in lines:
            if ln.get('quiet'): continue
            ok, why = line_ok(week, compare, log, ln)
            if ok: good.append({k: ln[k] for k in ('text', 'source_line')})
            else: dropped.append('%s %s: %s' % (aud, ln.get('key'), why))
        out_aud[aud] = good or [{'text': fd.QUIET}]
    flips = []
    for ln in draft.get('flips', []):
        ok, why = line_ok(week, compare, log, ln)
        if ok: flips.append({k: ln[k] for k in ('text', 'source_line')})
        else: dropped.append('flip %s: %s' % (ln.get('key'), why))
    return {'week': week, 'published': today, 'caveat': fd.CAVEAT, 'backfill': draft.get('backfill', False),
            'audiences': out_aud, 'flips': flips, 'dropped': dropped}


def run(findings_dir, compare_dir, log_path, today):
    log = fd.load_log(log_path)
    n = 0
    for f in sorted(glob.glob(os.path.join(findings_dir, '20*-W*.draft.json'))):
        week = os.path.basename(f)[:-len('.draft.json')]
        dst = os.path.join(findings_dir, week + '.json')
        if os.path.exists(dst): continue
        res = publish_week(json.load(open(f)), json.load(open(os.path.join(compare_dir, week + '.json'))), log, today)
        json.dump(res, open(dst, 'w'), indent=1, sort_keys=True)
        n += 1
        print('published %s%s' % (week, (' (dropped %d)' % len(res['dropped'])) if res['dropped'] else ''))
    return n


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--findings', default=os.path.join(ROOT, 'data/findings'))
    ap.add_argument('--compare', default=os.path.join(ROOT, 'data/compare'))
    ap.add_argument('--log', default=os.path.join(ROOT, 'data/verdicts/log.csv'))
    a = ap.parse_args()
    print('%d weeks published' % run(a.findings, a.compare, a.log, datetime.date.today().isoformat()))
