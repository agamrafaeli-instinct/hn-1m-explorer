#!/usr/bin/env python3
"""Writes the VC film cards h319-h332. Replaces the theme cards h100-h111 (persistence and points premium for six themes), h112 is not
replaced (comments are not in the archive), h113/h114/h119 are not replaced (top-story trimming and source domains are not in the share file),
and h115-h118 (history versions of the same themes) are covered by the persistence cards. Thresholds are copied from the old cards."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import film
THEMES = [('vcdc', 'Data centers and grid', 'data-centers'), ('vcgpu', 'GPU and chip hardware', 'gpu'), ('vcnb', 'Neural biology', 'neurobio'),
          ('vcaero', 'Aerospace', 'aerospace'), ('vcsol', 'Solar energy', 'solar'), ('vcrob', 'Physical robotics', 'robotics'), ('vcall', 'The six deep-tech themes together', 'all-themes')]
n = 319
for term, name, slug in THEMES:
    lab = film.TERMS[term][0]
    film.make_card('h%d' % n, slug + '-share', term, name + ': share of stories, all-time base',
        'Titles about %s take at least as large a share of HN stories in the latest 12 months as they did across all earlier years.' % lab.lower(),
        'Share of stories in the latest 12 months divided by the pooled share of all earlier stories since 2006: at least 1.5x strongly supports growth, at least 0.8x weakly supports persistence; at or below 0.5x refutes. Between is inconclusive. Title matches only, the dictionary is in scripts/film.py.',
        1.5, 0.8, 0.5, 'deep-tech investors', direction='up'); n += 1
    film.make_card('h%d' % n, slug + '-points', term, name + ': points premium, all-time base',
        'Stories about %s earn more points than the average story of the same months, across 2006 to 2026.' % lab.lower(),
        'Points per matching story against the average story of the same months, all months: at least 1.3x strongly supports, at least 1.1x weakly supports; at or below 0.9x refutes. Between is inconclusive.',
        1.3, 1.1, 0.9, 'deep-tech investors', kind='points', direction='up'); n += 1
print('last id', n - 1)
