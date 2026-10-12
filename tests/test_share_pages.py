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

    def test_week_pages_match_saved_weeks(self):
        idx = json.loads((ROOT / 'data/weekly/index.json').read_text())['weeks']
        for a in ('engineers', 'vcs', 'geeks'):
            for w in idx:
                t = (self.out / 'share/w' / a / (w['week'] + '.html')).read_text()
                self.assertIn('week ' + w['week'] + ' (', t)
                self.assertIn('url=../../../#/w/' + a + '/' + w['week'] + '"', t)
            cur = (self.out / 'share/w' / a / 'current.html').read_text()
            self.assertIn('url=../../../#/w/' + a + '/' + idx[-1]['week'] + '"', cur)
    def test_audience_pages(self):
        for a in ('engineers', 'vcs', 'geeks'):
            self.assertIn('url=../../#/a/' + a + '"', (self.out / 'share/a' / (a + '.html')).read_text())

if __name__ == '__main__': unittest.main()
