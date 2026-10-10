import json, os, subprocess, sys, tempfile, unittest
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
import film

class FilmTests(unittest.TestCase):
    def test_shares_file_shape(self):
        d = json.load(open(os.path.join(ROOT, 'data/film_shares.json')))
        m = d['monthly']
        self.assertGreater(len(m), 200)
        self.assertEqual(m[0]['month'], '2006-10')
        for k in film.TERMS:
            self.assertIn(k + '_s', m[0])
        self.assertTrue(all(r['total'] >= max(r[k + '_s'] for k in film.TERMS) for r in m))
    def test_card_evaluates_with_stated_base(self):
        with tempfile.TemporaryDirectory() as tmp:
            film.ROOT = tmp; os.makedirs(os.path.join(tmp, 'hypotheses'))
            p = film.make_card('h999', 'x', 'typescript', 't', 'h', 'e', 1.5, 1.15, 0.9, 'engineers')
            card = json.load(open(p))
        js = "const E=require('./hyp-eval.js');const c=%s;const d=require('./data/film_shares.json');const r=E.evaluate(c,d);console.log(JSON.stringify({v:r.value,a:r.label_a,b:r.label_b,verdict:r.verdict}))" % json.dumps(card)
        out = json.loads(subprocess.run(['node', '-e', js], cwd=ROOT, capture_output=True, text=True, check=True).stdout)
        self.assertEqual(out['verdict'], 'supported')
        self.assertAlmostEqual(out['v'], json.load(open(os.path.join(ROOT, 'data/alltime_pilot.json')))['typescript']['all_ratio'], places=2)
        self.assertRegex(out['a'], r'^Latest 12 months \(2025-08 to 2026-07\)$')
        self.assertRegex(out['b'], r'^All earlier stories \(2006-10 to 2025-07\)$')
if __name__ == '__main__': unittest.main()
