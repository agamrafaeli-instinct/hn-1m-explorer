#!/usr/bin/env python3
"""Honor score for the cards a PR adds, as markdown for the PR check summary. Informational: always exits 0."""
import argparse, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import honor_scorecard as H

PLAIN = {
    'sharp': 'Both groups need a label and rows, and the rules need numbers for supported and refuted, with a last "else" rule.',
    'interesting': 'Add an "audience" of engineers, deep-tech investors or curious readers.',
    'fresh': 'The verdict and confidence have not moved in 14 days while strong. Fixed-window cards are exempt.',
    'relevant': 'Use one of the three audiences, and group A should hold at least 30 items.',
    'insightful': 'Group B must differ from group A, "expect" must state a number, and the card needs at least one caveat.',
    'novel': 'An older card uses the same data and groups, or nearly the same title. Say what is new.',
}

def summary(res, ids):
    t = '## Honor score\n\nInformational. A low score never blocks the merge. Rules: docs/HONOR_SPEC.md.\n\n'
    rows = [c for c in res['cards'] if c['id'] in ids]
    if not rows: return t + 'No card in this PR could be scored.\n'
    for c in rows:
        sc = 'n/a' if c['score'] is None else '%d%%' % round(c['score'] * 100)
        t += '### %s: %s\n- Score: %s\n' % (c['id'], c['title'], sc)
        t += '- Passed: ' + (', '.join(k for k in H.CRITERIA if c['criteria'][k] is True) or 'none') + '\n'
        if not c['failing']: t += '- Nothing to change.\n'
        for k in c['failing']: t += '- Could be better, %s: %s\n' % (k, PLAIN[k])
        t += '\n'
    return t

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--root', default='.'); ap.add_argument('files', nargs='*')
    a = ap.parse_args()
    ids = {Path(f).name.split('-')[0] for f in a.files}
    try: print(summary(H.run(a.root), ids))
    except Exception as e: print('## Honor score\n\nCould not be computed: %s. This does not block the merge.\n' % e)
