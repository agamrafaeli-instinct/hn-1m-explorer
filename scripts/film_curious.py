#!/usr/bin/env python3
"""Writes the Curious film cards h339-h353 (replacing the deleted round 2 cards h135-h149). Each is a question about one title word list, asked
over all stories since 2006. Thresholds and question text come from docs/curious-round2-plan.json and the old card text kept in docs/curious-round2-cards.json.
Changes from the old cards: trimmed-points cards (h136, h144) compare plain points against the same-month average (rank trimming is not in the share
file), and weekend cards compare the term share of weekend stories against its share of all stories."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import film
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
plan = json.load(open(os.path.join(R, 'docs/curious-round2-plan.json')))['tests']
old = json.load(open(os.path.join(R, 'docs/curious-round2-cards.json')))
KIND = {'hit': 'hit', 'trim': 'points', 'weekend': 'weekend', 'comments': 'comments', 'discussion': 'discussion', 'points': 'points', 'growth': 'share'}
PHRASE = {'hit': 'Share of stories reaching ten points, against all stories of the same months, across 2006 to 2026',
          'points': 'Points per matching story against the average story of the same months, across 2006 to 2026',
          'weekend': 'The topic share of UTC weekend stories divided by its share of all stories, across 2006 to 2026',
          'comments': 'Comments per matching story against the average story of the same months, across 2006 to 2026',
          'discussion': 'Comments per point for matching stories divided by comments per point for all stories, across 2006 to 2026',
          'share': 'Share of stories in the latest 12 months divided by the pooled share of all earlier stories since 2006'}
for i, t in enumerate(plan):
    cid = 'h%d' % (339 + i); k = KIND[t['metric']]; o = old[t['id']]
    p = film.make_card(cid, t['key'], 'cu_' + t['key'], o['title'], o['hypothesis'].replace('in the later five weeks', 'across 2006 to 2026'),
        PHRASE[k] + ': at least %sx supports; at or below %sx refutes. Between is inconclusive. Title matching only.' % (t['support'], t['refute']),
        t['support'], t['support'], t['refute'], 'curious readers', kind=k, direction='up')
    c = json.load(open(p)); c['verdicts'] = [{'when': {'op': '>=', 'value': t['support']}, 'verdict': 'supported', 'confidence': 'weak'},
        {'when': {'op': '<=', 'value': t['refute']}, 'verdict': 'refuted', 'confidence': 'weak'}, {'else': True, 'verdict': 'inconclusive', 'confidence': 'inconclusive'}]
    c['caveats'] = ['Title matching only: the word list is in scripts/film.py and will miss and mis-match some stories.', 'Archive scores and comment counts for recent stories are low for all stories, so only ratios against the same months are used.', 'Associations do not show what causes attention.']
    json.dump(c, open(p, 'w'), indent=2); open(p, 'a').write('\n')
print('last id h%d' % (339 + len(plan) - 1))
