import json, os, sys, tempfile, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))
import finder_select as f

def c(term, gen, **ratios): return {'term': term, 'label': term, 'generator': gen, 'windows': {}, 'ratios': ratios, 'note': ''}
CANDS = {'candidates': [c('a', 'cross_window', x=2.0, y=1.0), c('b', 'reversal', x=0.3, y=2.4), c('b', 'cross_window', x=2.4, y=1.1), c('c', 'spike', m=1.3), c('d', 'spike', m=1.25)], 'rejected': [{'term': 'z', 'generator': 'spike', 'reason': 'few matches'}]}

class Select(unittest.TestCase):
    def test_rank_and_ties(self):
        ranked, rej = f.select(CANDS, [], '2026-10-11')
        scores = [x['score'] for x in ranked]; self.assertEqual(scores, sorted(scores, reverse=True))
        self.assertEqual(len([x for x in ranked if x['term'] == 'b']), 1)
        self.assertTrue(any(r['term'] == 'b' and 'stronger' in r['reason'] for r in rej))
        self.assertTrue(any(r['term'] == 'z' for r in rej))
    def test_cooldown_90_days(self):
        ranked, rej = f.select(CANDS, [{'term': 'c', 'date': '2026-08-01'}], '2026-10-11')   # 71 days ago
        self.assertNotIn('c', [x['term'] for x in ranked]); self.assertTrue(any(r['term'] == 'c' and '90' in r['reason'] for r in rej))
        ranked, _ = f.select(CANDS, [{'term': 'c', 'date': '2026-06-01'}], '2026-10-11')       # 132 days ago
        self.assertIn('c', [x['term'] for x in ranked])
    def test_same_input_same_order(self):
        self.assertEqual(json.dumps(f.select(CANDS, [], '2026-10-11')), json.dumps(f.select(CANDS, [], '2026-10-11')))
    def test_evidence_carries_caveat_and_dictionary(self):
        ranked, _ = f.select(CANDS, [], '2026-10-11', {'a'}); e = f.evidence([x for x in ranked if x['term'] == 'a'][0], 'x')
        self.assertIn('Archive scores', e['caveat']); self.assertEqual(e['dictionary'], 'data/finder/dictionaries/a.json')
    def test_rerun_keeps_pick(self):
        with tempfile.TemporaryDirectory() as d:
            os.makedirs(os.path.join(d, 'data/finder')); json.dump(CANDS, open(os.path.join(d, 'data/finder/candidates.json'), 'w'))
            f.ROOT = d; f.main('2026-10-11'); first = open(os.path.join(d, 'data/finder/2026-10-11.json')).read()
            json.dump({'candidates': list(reversed(CANDS['candidates'][:2])), 'rejected': []}, open(os.path.join(d, 'data/finder/candidates.json'), 'w'))
            f.main('2026-10-11'); self.assertEqual(first, open(os.path.join(d, 'data/finder/2026-10-11.json')).read())
if __name__ == '__main__': unittest.main()
