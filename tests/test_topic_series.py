import json, os, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fixture_root import FIX
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
class TopicSeries(unittest.TestCase):
    def test_rows(self):
        d = json.load(open(FIX / 'data/topic_series.json'))
        ok = {'Emergence', 'Reversal', 'Peak decay', 'Composition shift', 'Steady'}
        self.assertTrue(d['topics'])
        self.assertEqual(len({t['id'] for t in d['topics']}), len(d['topics']), 'topic ids must be unique')
        for t in d['topics']:
            self.assertIn(t['pattern'], ok, t['id'])
            self.assertEqual(len(t['series']), len(d['months']), t['id'])
            self.assertGreater(t['latest']['total'], 0, t['id']); self.assertGreater(t['prior']['total'], 0, t['id'])
            self.assertTrue(t['matcher'], t['id'])
        gpt = [t for t in d['topics'] if t['id'] == 'gpt'][0]
        self.assertEqual(gpt['pattern'], 'Reversal')
if __name__ == '__main__': unittest.main()
