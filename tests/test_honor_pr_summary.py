import pathlib, sys, unittest
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import honor_pr_summary as P, honor_scorecard as H

class HonorPR(unittest.TestCase):
    def test_every_criterion_has_plain_words(self):
        self.assertEqual(set(P.PLAIN), set(H.CRITERIA))
    def test_summary_names_card_score_and_never_blocks(self):
        res = H.run(str(ROOT)); cid = res['cards'][0]['id']
        t = P.summary(res, {cid})
        self.assertIn(cid, t); self.assertIn('Score:', t); self.assertIn('never blocks', t)
    def test_failing_card_lists_what_to_change(self):
        res = {'cards': [{'id': 'h900', 'title': 't', 'score': 0.5, 'criteria': {k: (k != 'novel') for k in H.CRITERIA}, 'failing': ['novel']}]}
        self.assertIn('Could be better, novel', P.summary(res, {'h900'}))
    def test_unknown_card(self):
        self.assertIn('could be scored', P.summary({'cards': []}, {'h901'}))

if __name__ == '__main__': unittest.main()
