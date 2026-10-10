#!/usr/bin/env python3
"""Write stories/<id>.json for film cards from the card file, following docs/THROUGHLINE_SPEC.md.

  python scripts/make_stories.py h339 h340 ...     (or --range h339 h368)

Text is built from the card's own title, per_label, caveats and rules. Every number is a placeholder.
A story is only shown while the computed verdict equals for_verdict, so the verdict comes from the current tally."""
import argparse, glob, json, pathlib, re, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
BANNED = re.compile(r"preregist|pre-regist|\bcaus(e|es|ed)\b|\bbecause\b|adoption|\bdemand\b|sentiment|statistical(ly)? (confidence|significan)|confirmed", re.I)
WORD = {'>=': 'or more', '<=': 'or less', '>': 'or more', '<': 'or less'}

def card_path(i): return next(ROOT.glob(f'hypotheses/{i}-*.json'))

def verdicts():
    t = json.load(open(ROOT / 'hypotheses' / 'tally.json')) if (ROOT / 'hypotheses' / 'tally.json').exists() else json.load(open('/tmp/site/hypotheses/tally.json'))
    return {x['name'].split('-')[0]: x['verdict'] for x in t}

def build(c, verdict):
    ch = c['check']; stat = ch['stat']; title = c['title'].rstrip('.')
    sup = next((v for v in c['verdicts'] if v.get('verdict') == 'supported' and v.get('when')), None)
    ref = next((v for v in c['verdicts'] if v.get('verdict') == 'refuted' and v.get('when')), None)
    sw = WORD.get(sup['when']['op'], 'or more') if sup else 'at least'
    rw = WORD.get(ref['when']['op'], 'or less') if ref else None
    s = {'schema': 1, 'id': c['id'], 'for_verdict': verdict}
    s['question'] = 'Does the data back this claim: "%s"?' % title
    if stat == 'pooled_share_ratio':
        s['why'] = 'It checks whether this topic takes a different share of all HN stories now than it did across the earlier years.'
        s['opening'] = 'In {label_a}, the share was {a}. In {label_b}, it was {b}.'
    else:
        per = ch.get('per_label') or 'points per story'
        s['why'] = 'It checks whether stories on this topic do better than the average story of the same months. The measure is %s.' % per
        s['opening'] = 'For these stories the measure was {a}. For the average story of the same months it was {b}.'
    nsup = sum(1 for v in c['verdicts'] if v.get('verdict') == 'supported' and v.get('when'))
    nref = sum(1 for v in c['verdicts'] if v.get('verdict') == 'refuted' and v.get('when'))
    if nsup > 1: sup = None   # the page shows only the first rule value, so do not quote it as the line
    if nref > 1: ref = None
    lead = {'supported': 'Yes.', 'refuted': 'No.', 'inconclusive': 'Not clear.'}[verdict]
    t = lead + ' The ratio is {ratio}x.'
    if sup: t += ' The card supports the claim at {support_at}x %s.' % sw
    if ref: t += ' It refutes the claim at {refute_at}x %s.' % rw
    if not sup and not ref: t += ' The lines for yes and no are on the card.'
    s['takeaway'] = t
    cav = [x for x in c.get('caveats', []) if not BANNED.search(x)]
    parts = cav[:2]
    if 'xploratory' in c.get('thresholds_note', ''): parts.append('The thresholds were copied from earlier cards, so this test is exploratory.')
    s['boundary'] = ' '.join(parts)
    s['explore'] = []
    return s

if __name__ == '__main__':
    a = argparse.ArgumentParser(); a.add_argument('ids', nargs='*'); a.add_argument('--range', nargs=2); a.add_argument('--force', action='store_true')
    x = a.parse_args(); ids = list(x.ids)
    if x.range:
        lo, hi = (int(r.lstrip('h')) for r in x.range); ids += ['h%d' % n for n in range(lo, hi + 1)]
    V = verdicts(); idx = json.load(open(ROOT / 'stories' / 'index.json')); done = []
    for i in ids:
        try: p = card_path(i)
        except StopIteration: continue
        if (ROOT / 'stories' / f'{i}.json').exists() and not x.force: continue   # never overwrite a hand-written story
        c = json.load(open(p)); st = build(c, V[i])
        json.dump(st, open(ROOT / 'stories' / f'{i}.json', 'w'), indent=1); open(ROOT / 'stories' / f'{i}.json', 'a').write('\n')
        if i not in idx['ids']: idx['ids'].append(i)
        done.append(i)
    idx['ids'] = sorted(set(idx['ids']))
    json.dump(idx, open(ROOT / 'stories' / 'index.json', 'w')); print('wrote', len(done), done)
