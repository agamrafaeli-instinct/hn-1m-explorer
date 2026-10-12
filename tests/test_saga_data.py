import csv, sys, unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
import saga_data as S

class SagaData(unittest.TestCase):
    def test_numbers_match_the_source(self):
        d = S.build(ROOT)
        rows = [r for r in csv.DictReader(open(ROOT / 'data/history/daily.csv')) if r['date'].startswith('2015')]
        i = d['years'].index(2015)
        self.assertEqual(d['stories'][i], sum(int(r['stories']) for r in rows))
        self.assertAlmostEqual(d['points_per_story'][i], sum(int(r['score_sum_stories']) for r in rows) / d['stories'][i], places=1)

    def test_covers_every_year(self):
        d = S.build(ROOT)
        self.assertEqual(d['years'][0], 2006)
        self.assertEqual(len(d['years']), len(d['stories']))
        self.assertEqual(len(d['years']), len(d['points_per_story']))
        self.assertIn(2026, d['low_score_years'])

if __name__ == '__main__': unittest.main()
