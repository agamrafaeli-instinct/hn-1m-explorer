#!/usr/bin/env python3
"""Story finder, step 3 (#178): evidence record and selection.
  python3 scripts/finder_select.py [--date YYYY-MM-DD]
Reads data/finder/candidates.json, data/finder/dictionaries/<term>.json (when present) and data/finder/shown.json (list of {term, date}).
Writes data/finder/queue.json (ranked list plus a reason for every rejected candidate) and data/finder/<date>.json (today's pick with its evidence).
Rank (documented here and in the queue file):
  effect       the largest |ln(ratio)| among the candidate's ratios (spike uses month vs previous 12-month maximum)
  sturdiness   the share of the candidate's ratios that point the same way as the largest one, flat counting as no agreement
  score        effect x sturdiness. Ties break on term name, so the order is the same on every run.
One entry per term: the best generator wins, the others are listed as rejected with that reason.
A term shown in the last 90 days is skipped. A rerun on the same date keeps the pick already written for that date.
"""
import json, math, os, sys, datetime as dt
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
COOLDOWN_DAYS = 90
CAVEAT = 'Title matching only. Archive scores for 2025-26 are low for all stories, so only ratios are used.'

def effect_and_sturdy(c):
    rs = [v for v in c['ratios'].values() if v]
    if not rs: return 0.0, 0.0
    logs = [math.log(r) for r in rs]; big = max(logs, key=abs)
    agree = sum(1 for l in logs if l * big > 0 and abs(l) >= math.log(1.25))
    return abs(big), agree / len(logs)

def select(cands, shown, today, dictionaries=()):
    cutoff = (dt.date.fromisoformat(today) - dt.timedelta(days=COOLDOWN_DAYS)).isoformat()
    recent = {s['term'] for s in shown if s['date'] >= cutoff}
    scored, rejected = [], list(cands.get('rejected', []))
    for c in cands['candidates']:
        e, s = effect_and_sturdy(c)
        scored.append(dict(c, effect=round(e, 4), sturdiness=round(s, 4), score=round(e * s, 4)))
    scored.sort(key=lambda x: (-x['score'], x['term'], x['generator']))
    ranked, seen = [], set()
    for c in scored:
        if c['term'] in recent: rejected.append({'term': c['term'], 'generator': c['generator'], 'reason': 'shown in the last %d days' % COOLDOWN_DAYS}); continue
        if c['term'] in seen: rejected.append({'term': c['term'], 'generator': c['generator'], 'reason': 'a stronger generator already covers this term'}); continue
        if c['score'] <= 0: rejected.append({'term': c['term'], 'generator': c['generator'], 'reason': 'no ratio points one way by 1.25x or more'}); continue
        seen.add(c['term']); ranked.append(c)
    for i, c in enumerate(ranked): c['rank'] = i + 1; c['has_dictionary'] = c['term'] in dictionaries
    return ranked, rejected

def evidence(c, source):
    return {'schema': 1, 'term': c['term'], 'label': c['label'], 'generator': c['generator'], 'windows': c['windows'], 'ratios': c['ratios'], 'note': c.get('note', ''),
            'dictionary': ('data/finder/dictionaries/%s.json' % c['term']) if c['has_dictionary'] else None, 'minimum_matches_checked': True, 'caveat': CAVEAT, 'source': source}

def main(today):
    d = os.path.join(ROOT, 'data/finder'); cands = json.load(open(os.path.join(d, 'candidates.json')))
    sp = os.path.join(d, 'shown.json'); shown = json.load(open(sp)) if os.path.exists(sp) else []
    dd = os.path.join(d, 'dictionaries'); dicts = {f[:-5] for f in os.listdir(dd)} if os.path.isdir(dd) else set()
    out = os.path.join(d, today + '.json')
    ranked, rejected = select(cands, [s for s in shown if s.get('date') != today], today, dicts)
    queue = {'schema': 1, 'date': today, 'rank_rule': 'score = effect x sturdiness; effect is the largest |ln ratio|; sturdiness is the share of ratios pointing the same way; ties break on term name', 'ranked': ranked, 'rejected': rejected}
    json.dump(queue, open(os.path.join(d, 'queue.json'), 'w'), indent=1, sort_keys=True)
    if os.path.exists(out): print('pick for', today, 'already written, kept'); return
    if not ranked: print('no candidate today'); return
    json.dump(evidence(ranked[0], 'data/finder/candidates.json'), open(out, 'w'), indent=1, sort_keys=True); print('pick', ranked[0]['term'], ranked[0]['generator'])

if __name__ == '__main__':
    a = sys.argv[1:]; main(a[a.index('--date') + 1] if '--date' in a else dt.date.today().isoformat())
