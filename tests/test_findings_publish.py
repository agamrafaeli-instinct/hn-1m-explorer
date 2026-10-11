import copy, glob, json, os, sys, tempfile, unittest
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
import findings_draft as fd, findings_publish as fp

COMPARE = {'end_exclusive_utc': '2026-10-05', 'audiences': {
    'engineers': {'rose': [{'key': 'pg', 'label': 'Postgres', 'diff': 17.9, 'expected': 31.1, 'this': 49}], 'fell': [], 'new': [], 'shares': []},
    'vcs': {'rose': [], 'fell': [], 'new': [], 'shares': []}, 'geeks': {'rose': [], 'fell': [], 'new': [], 'shares': []}}}
LOG = [{'date': '2026-10-01', 'card_id': 'h1', 'verdict': 'supported', 'confidence': 'strong'},
       {'date': '2026-10-02', 'card_id': 'h1', 'verdict': 'refuted', 'confidence': 'weak'}]

class Publish(unittest.TestCase):
    def draft(self): return fd.draft_week('2026-W40', COMPARE, LOG, {})
    def test_good_week_passes(self):
        r = fp.publish_week(self.draft(), COMPARE, LOG, '2026-10-11')
        self.assertEqual(r['dropped'], [])
        self.assertEqual(len(r['audiences']['engineers']), 1); self.assertEqual(len(r['flips']), 1)
        self.assertEqual(r['audiences']['vcs'][0]['text'], fd.QUIET)
    def test_wrong_number_dropped(self):
        d = self.draft(); d['audiences']['engineers'][0]['text'] = d['audiences']['engineers'][0]['text'].replace('49', '94')
        r = fp.publish_week(d, COMPARE, LOG, '2026-10-11')
        self.assertEqual(r['audiences']['engineers'][0]['text'], fd.QUIET); self.assertEqual(len(r['dropped']), 1)
    def test_missing_key_banned_word_and_flip_not_in_log(self):
        d = self.draft(); d['audiences']['engineers'][0]['key'] = 'nope'
        d['flips'][0]['text'] = 'Card h1 changed from refuted to supported on 2026-10-02.'
        r = fp.publish_week(d, COMPARE, LOG, '2026-10-11')
        self.assertEqual(len(r['dropped']), 2); self.assertEqual(r['flips'], [])
        d = self.draft(); d['audiences']['engineers'][0]['text'] = 'Postgres will surge this week, 49 against 31.1.'
        self.assertEqual(len(fp.publish_week(d, COMPARE, LOG, '2026-10-11')['dropped']), 1)
    def test_saved_week_never_overwritten(self):
        with tempfile.TemporaryDirectory() as t:
            os.makedirs(t + '/c'); json.dump(COMPARE, open(t + '/c/2026-W40.json', 'w'))
            json.dump(self.draft(), open(t + '/2026-W40.draft.json', 'w'))
            self.assertEqual(fp.run(t, t + '/c', t + '/none.csv', '2026-10-11'), 1)
            before = open(t + '/2026-W40.json').read()
            json.dump({'week': 'x'}, open(t + '/2026-W40.draft.json', 'w'))
            self.assertEqual(fp.run(t, t + '/c', t + '/none.csv', '2026-10-12'), 0)
            self.assertEqual(open(t + '/2026-W40.json').read(), before)
    def test_real_weeks_publish_with_nothing_dropped(self):
        for f in glob.glob(os.path.join(ROOT, 'data/findings/20*.draft.json')):
            week = os.path.basename(f)[:-len('.draft.json')]
            c = json.load(open(os.path.join(ROOT, 'data/compare', week + '.json')))
            r = fp.publish_week(json.load(open(f)), c, fd.load_log(os.path.join(ROOT, 'data/verdicts/log.csv')), '2026-10-11')
            self.assertEqual(r['dropped'], [], week)
if __name__ == '__main__': unittest.main()
