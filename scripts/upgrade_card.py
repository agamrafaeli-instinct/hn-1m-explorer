#!/usr/bin/env python3
"""Replace a card that needs an upgrade with a new one (#249). The old card stays on the site; the new card sets "replaces" (docs/HONOR_SPEC.md).
  python3 scripts/upgrade_card.py hOLD hNEW [--set key=value ...] [--strong X] [--weak X] [--refute X] [--question "..."]
The new card is a copy of the old card file with a new id and "replaces". --set changes a top-level field (audience, title, hypothesis, expect, ...).
--strong, --weak and --refute change the threshold values in the verdict rules. Then the story, index entry and Honor score are made as for a new card."""
import argparse, copy, json, os, pathlib, sys
sys.path.insert(0, os.path.dirname(__file__))
import card_tools

def upgraded(old, new_id, sets=None, strong=None, weak=None, refute=None):
    c = copy.deepcopy(old); c['id'] = new_id; c['replaces'] = old['id']
    for k, v in (sets or {}).items(): c[k] = v
    th = [v for v in c['verdicts'] if v.get('when')]
    sup = [v for v in th if v['verdict'] == 'supported']; ref = [v for v in th if v['verdict'] == 'refuted']
    if strong is not None and sup: sup[0]['when']['value'] = strong
    if weak is not None and len(sup) > 1: sup[-1]['when']['value'] = weak
    if refute is not None and ref: ref[0]['when']['value'] = refute
    return c

if __name__ == '__main__':
    a = argparse.ArgumentParser(); a.add_argument('old'); a.add_argument('new'); a.add_argument('--set', action='append', default=[])
    a.add_argument('--strong', type=float); a.add_argument('--weak', type=float); a.add_argument('--refute', type=float); a.add_argument('--question'); x = a.parse_args()
    root = card_tools.ROOT; op = next((root / 'hypotheses').glob(x.old + '-*.json'))
    if list((root / 'hypotheses').glob(x.new + '-*.json')): raise SystemExit(x.new + ' already exists')
    c = upgraded(json.load(open(op)), x.new, dict(kv.split('=', 1) for kv in x.set), x.strong, x.weak, x.refute)
    slug = op.stem.split('-', 1)[1]
    card_tools.report(card_tools.finish(c, root / 'hypotheses' / ('%s-%s.json' % (x.new, slug)), root, x.question))
