import json, sys, unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
import rings_data as R

class RingsData(unittest.TestCase):
    def test_numbers_match_the_source(self):
        d = R.build(ROOT); fs = json.loads((ROOT / 'data/film_shares.json').read_text())['monthly']
        y = d['years'][10]; rows = [r for r in fs if r['month'].startswith(str(y))]
        t = {x['id']: x for x in d['themes']}['rust']
        self.assertAlmostEqual(t['share'][10], sum(r['rust_s'] for r in rows) / sum(r['total'] for r in rows), places=4)

    def test_every_series_covers_every_year(self):
        d = R.build(ROOT); n = len(d['years'])
        self.assertEqual(d['years'][0], 2006)
        self.assertEqual(len(d['domains']), n)
        for t in d['themes']: self.assertEqual(len(t['share']), n)
        for v in d['types'].values(): self.assertEqual(len(v), n)

    def test_domain_shares_fit_inside_the_year(self):
        d = R.build(ROOT)
        for i, y in enumerate(d['years']):
            if d['stories'][i]: self.assertLessEqual(sum(n for _, n in d['domains'][i]), d['stories'][i], y)

    def test_copy_is_neutral(self):
        s = json.dumps(R.build(ROOT)).lower() + (ROOT / 'rings.js').read_text().lower()
        for w in ('never changes', 'taste has shifted', 'votes'): self.assertNotIn(w, s)

if __name__ == '__main__': unittest.main()
