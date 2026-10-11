import json, os, sys, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))
import finder_candidates as f

def months(n, start=2006):
    out = []
    for i in range(n):
        y = start + i // 12
        out.append('%d-%02d' % (y, i % 12 + 1))
    return out

def fixture(shape):
    """240 months from 2006-01; every month has 5000 stories. shape(i) gives the matches for the term in month i."""
    M = []
    for i, mo in enumerate(months(240)):
        M.append({'month': mo, 'total': 5000, 'x_s': shape(i)})
    return {'terms': {'x': {'label': 'X'}}, 'monthly': M}

def gens(res): return sorted(c['generator'] for c in res['candidates'])

class Finder(unittest.TestCase):
    def test_flat_term_gives_nothing(self):
        self.assertEqual(f.run(fixture(lambda i: 40))['candidates'], [])
    def test_spike(self):
        r = f.run(fixture(lambda i: 100 if i == 239 else 40))
        self.assertIn('spike', gens(r))
    def test_spike_needs_30_matches(self):
        r = f.run(fixture(lambda i: 20 if i == 239 else 5))
        self.assertNotIn('spike', gens(r))
        self.assertEqual(r['rejected'][0]['generator'], 'spike')
    def test_reversal(self):
        # high in 2015, low for years, then back up in the latest 12 months but under the peak
        def s(i):
            y = 2006 + i // 12
            if y == 2015: return 200
            if i >= 228: return 100
            return 60
        # prior pooled share is low (about 1.2%), peak is 4%, latest is 2%: up against prior, down against peak
        r = f.run(fixture(s)); self.assertIn('reversal', gens(r))
        c = [c for c in r['candidates'] if c['generator'] == 'reversal'][0]
        self.assertLess(c['ratios']['latest_vs_peak'], 0.8); self.assertGreater(c['ratios']['latest_vs_prior'], 1.25)
    def test_cross_window(self):
        # the 12 months before the latest 12 are as high as the latest, but all earlier months were lower
        r = f.run(fixture(lambda i: 90 if i >= 216 else 40)); self.assertIn('cross_window', gens(r))
    def test_same_data_same_file(self):
        fx = fixture(lambda i: 100 if i == 239 else 40)
        self.assertEqual(json.dumps(f.run(fx), sort_keys=True), json.dumps(f.run(fx), sort_keys=True))
    def test_real_data_finds_pilot_terms(self):
        fs = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'data', 'film_shares.json')))
        found = {(c['term'], c['generator']) for c in f.run(fs)['candidates']}
        self.assertIn(('gpt', 'reversal'), found); self.assertIn(('typescript', 'cross_window'), found)
if __name__ == '__main__': unittest.main()
