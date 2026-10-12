import json, pathlib, re, subprocess, sys, tempfile, unittest, html
ROOT = pathlib.Path(__file__).resolve().parents[1]

class SharePages(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(); cls.out = pathlib.Path(cls.tmp.name) / 'site'
        subprocess.run([sys.executable, str(ROOT / 'scripts/stage_site.py'), '--root', str(ROOT), '--output', str(cls.out)], check=True, capture_output=True)
    @classmethod
    def tearDownClass(cls): cls.tmp.cleanup()
    def cards(self):
        return [json.loads(f.read_text()) for f in sorted((ROOT / 'hypotheses').glob('*.json')) if f.name not in ('index.json', 'bundle.json', 'tally.json')]
    def test_every_card_has_a_page(self):
        cards = self.cards(); self.assertGreater(len(cards), 50)
        for c in cards: self.assertTrue((self.out / 'share/c' / (c['id'] + '.html')).is_file(), c['id'])
    def test_title_and_target_match_card(self):
        for c in self.cards():
            t = (self.out / 'share/c' / (c['id'] + '.html')).read_text()
            self.assertIn('<title>' + html.escape(c['title'], quote=True), t)
            self.assertIn('property="og:title"', t)
            self.assertIn('url=../../#/c/' + c['id'] + '"', t)

if __name__ == '__main__': unittest.main()
