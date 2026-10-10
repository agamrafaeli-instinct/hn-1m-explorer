#!/usr/bin/env python3
"""Writes the Engineers film cards h300-h317 (replacing h012-h030, except h026 which has no all-time source: comments are not in the archive).
Thresholds and question wording are copied from the old card; the window text is swapped for the all-time base."""
import glob, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import film
# old id: (term, versus, kind, direction, slug)
MAP = {12: ('typescript', 'js', 'share', 'up', 'typescript-vs-javascript'), 13: ('agents', 'gpt', 'share', 'up', 'agents-vs-chatbots'),
 14: ('sql', 'nosql', 'share', 'up', 'sql-vs-nosql'), 15: ('dist', None, 'share', 'down', 'microservices-cooling'), 16: ('react', None, 'share', 'down', 'react-loosening'),
 17: ('newfe', None, 'share', 'up', 'new-frontend-rising'), 18: ('infra', None, 'share', 'up', 'infra-keeps-share'), 19: ('oldguard', None, 'share', 'down', 'old-guard-fades'),
 20: ('aicode', None, 'points', 'up', 'ai-coding-points'), 21: ('localdb', None, 'points', 'up', 'localdb-points'), 22: ('tinker', None, 'share', 'up', 'returning-to-tools'),
 23: ('syslang', None, 'share', 'up', 'systems-languages'), 24: ('maint', None, 'share', 'up', 'maintenance-talk'), 25: ('llm', None, 'share', 'up', 'llm-plumbing'),
 27: ('go', 'python', 'share', 'up', 'go-vs-python'), 28: ('kubernetes', None, 'share', 'down', 'kubernetes-cooling'), 29: ('vue', None, 'share', 'up', 'vue-rising'), 30: ('java', None, 'share', 'down', 'java-fading')}
def swap(t):
    for a, b in [('in the latest 6 months than the first 6', 'in the latest 12 months than in all earlier stories since 2006 (pooled)'),
                 ('the latest 6 months than the first 6', 'the latest 12 months than in all earlier stories since 2006 (pooled)'),
                 ('in the latest 6 months as the first 6', 'in the latest 12 months as in all earlier stories since 2006 (pooled)'),
                 ('the monthly ratio of', 'the ratio of')]:
        t = t.replace(a, b)
    assert 'first 6' not in t, t
    return t
for n, (term, vs, kind, direction, slug) in MAP.items():
    old = json.load(open(glob.glob('hypotheses/h%03d-*.json' % n)[0]))
    th = [v['when']['value'] for v in old['verdicts'] if 'when' in v]
    expect = swap(old['expect'])
    if kind == 'points':
        expect = re.sub(r'If true, points per .*$', 'If true, points per %s story should be at least %sx the points of the average story in the same months, across all of 2006 to 2026 (%sx is weak, %sx or lower refutes it).' % ({'aicode': 'AI coding', 'localdb': 'SQLite/DuckDB'}[term], th[0], th[1], th[2]), expect)
    film.make_card('h%d' % (300 + n - 12), slug, term, old['title'], old['hypothesis'], expect, th[0], th[1], th[2], old['audience'], versus=vs, kind=kind, direction=direction)
    print('h%d <- h%03d %s' % (300 + n - 12, n, expect[:90]))
