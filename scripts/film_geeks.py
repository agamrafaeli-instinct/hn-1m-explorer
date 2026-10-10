#!/usr/bin/env python3
"""Writes the Geeks film cards h354-h368 (replacing the deleted rolling-window cards h120-h134). Each asks one question of one title word list over all
stories since 2006. Thresholds are copied from the cards they replace.
Not filmable from the monthly share file, so replaced by an all-time share question for the same word list (flagged in #158):
  h121 (without top 1 percent) and h122 (without top domain) need per-story scores and domains; h126 (last 5 weeks against first 5) and
  h127 (weekend points) are recent-window or weekday-level questions. Their word lists are asked as share-growth cards instead."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import film
UP = (1.3, 1.1, 0.9)
P = 'across 2006 to 2026'
TXT = {'points': 'Points per matching story against the average story of the same months, ' + P,
       'hit': 'Share of stories reaching ten points, against all stories of the same months, ' + P,
       'comments': 'Comments per matching story against the average story of the same months, ' + P,
       'discussion': 'Comments per point for matching stories divided by comments per point for all stories, ' + P,
       'weekend': 'The topic share of UTC weekend stories divided by its share of all stories, ' + P,
       'share': 'Share of stories in the latest 12 months divided by the pooled share of all earlier stories since 2006'}
W = 'weird and mysterious words'
CARDS = [
 ('weird-points', 'gk_weird', 'points', 'up', 'Weird words earn more points', 'Titles with weird, strange, mysterious, ancient, abandoned or forgotten earn more points per story than other stories.'),
 ('weird-hit-rate', 'gk_weird', 'hit', 'up', 'Weird words reach ten points more often', 'Weird-word stories reach 10 or more points more often than other stories, so a lead is not a few outliers.'),
 ('weird-comments', 'gk_weird', 'comments', 'up', 'Weird gets talked about', 'Weird-word stories draw more comments per story than other stories.'),
 ('weird-votes-not-talk', 'gk_weird', 'discussion', 'down', 'Weird gets votes, not arguments', 'Weird-word stories have fewer comments per point than other stories.'),
 ('weird-weekend', 'gk_weird', 'weekend', 'up', 'Weird gets posted on weekends', 'Weird-word stories make up a bigger share of weekend submissions than of all submissions.'),
 ('weird-growth', 'gk_weird', 'share', 'up', 'Weird words are growing', 'Weird-word titles are a bigger share of stories in the latest 12 months than before.'),
 ('science-points', 'gk_science', 'points', 'up', 'Science words earn more points', 'Stories with plain science words earn more points per story than other stories.'),
 ('science-growth', 'gk_science', 'share', 'up', 'Science words are growing', 'Science-word titles are a bigger share of stories in the latest 12 months than before.'),
 ('retro-points', 'gk_retro', 'points', 'up', 'Retro computing earns more points', 'Stories about retro and vintage computing earn more points per story than other stories.'),
 ('retro-growth', 'gk_retro', 'share', 'up', 'Retro computing is growing', 'Retro-computing titles are a bigger share of stories in the latest 12 months than before.'),
 ('history-points', 'gk_history', 'points', 'up', 'History words earn more points', 'Stories with history words earn more points per story than other stories.'),
 ('puzzle-points', 'gk_puzzle', 'points', 'up', 'Puzzles earn more points', 'Puzzle and game-of-skill stories earn more points per story than other stories.'),
 ('puzzle-growth', 'gk_puzzle', 'share', 'up', 'Puzzles are growing', 'Puzzle titles are a bigger share of stories in the latest 12 months than before.'),
 ('show-hn-points', 'gk_showhn', 'points', 'up', 'Show HN earns more points', 'Show HN posts earn more points per story than other stories.'),
 ('boring-points', 'gk_boring', 'points', 'down', 'Business-software words sink', 'Titles with business-software words earn fewer points per story: the control for the odd-and-fun claims.'),
]
for i, (slug, term, kind, d, title, hyp) in enumerate(CARDS):
    cid = 'h%d' % (354 + i)
    s, w, r = (0.75, 0.9, 1.0) if d == 'down' and kind == 'points' else (0.85, 0.95, 1.05) if d == 'down' else UP
    if kind == 'share': s, w, r = 1.3, 1.1, 0.9
    p = film.make_card(cid, slug, term, title, hyp, TXT[kind] + ': ' + ('at or below %sx supports; at or above %sx refutes' % (w, r) if d == 'down' else 'at least %sx supports (%sx or more is strong); at or below %sx refutes' % (w, s, r)) + '. Between is inconclusive. Title matching only.',
        s, w, r, 'curious readers', kind=kind, direction=d)
    c = json.load(open(p)); c['caveats'] = ['Title matching only: the word list is in scripts/film.py and will miss and mis-match some stories.', 'Archive scores and comment counts for recent stories are low for all stories, so only ratios against the same months are used.', 'Associations do not show what causes attention.']
    json.dump(c, open(p, 'w'), indent=2); open(p, 'a').write('\n')
print('last id h%d' % (354 + len(CARDS) - 1))
