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
        cards = self.cards(); self.assertTrue(cards); self.assertEqual(len(list((self.out / 'share/c').glob('*.html'))), len(cards))
        for c in cards: self.assertTrue((self.out / 'share/c' / (c['id'] + '.html')).is_file(), c['id'])
    def test_title_and_target_match_card(self):
        for c in self.cards():
            t = (self.out / 'share/c' / (c['id'] + '.html')).read_text()
            self.assertIn('<title>' + html.escape(c['title'], quote=True), t)
            self.assertIn('property="og:title"', t)
            self.assertIn('url=../../#/c/' + c['id'] + '"', t)

    def test_route_pages_match_router_titles(self):
        router = (ROOT / 'router.js').read_text()
        for r in ('home', 'phoenix', 'rings'):
            m = re.search(r"^\s+" + r + r": \['([^']+)', '([^']+)'\]", router, re.M)
            self.assertTrue(m, r + ' has no TITLES entry in router.js')
            t = (self.out / 'share/p' / (r + '.html')).read_text()
            self.assertIn('<title>' + html.escape(m.group(1), quote=True) + ' (Hacker News)</title>', t)
            self.assertIn('content="' + html.escape(m.group(2), quote=True) + '"', t)
            self.assertIn('url=../../#/' + ('' if r == 'home' else r) + '"', t)

    def test_week_pages_match_saved_weeks(self):
        idx = json.loads((ROOT / 'data/weekly/index.json').read_text())['weeks']
        for a in ('engineers', 'vcs', 'geeks'):
            for w in idx:
                t = (self.out / 'share/w' / a / (w['week'] + '.html')).read_text()
                self.assertIn('week ' + w['week'] + ' (', t)
                self.assertIn('url=../../../#/w/' + a + '/' + w['week'] + '"', t)
            cur = (self.out / 'share/w' / a / 'current.html').read_text()
            self.assertIn('url=../../../#/w/' + a + '/' + idx[-1]['week'] + '"', cur)
    def test_no_audience_card_list_pages(self):
        self.assertFalse((self.out / 'share/a').exists())


class ShareButtons(unittest.TestCase):
    def test_buttons_use_share_pages(self):
        self.assertIn("'share/c/' + card.id + '.html'", (ROOT / 'hypotheses.js').read_text())
        self.assertNotIn("'#/c/' + card.id", (ROOT / 'hypotheses.js').read_text().split("share-btn'")[1].split('addEventListener')[0])
        self.assertIn("'share/w/' + a + '/' + week + '.html'", (ROOT / 'weekly.js').read_text())

class ShareNumbersMatchData(unittest.TestCase):
    def test_route_descriptions_use_numbers_from_the_data(self):
        import json, sys
        sys.path.insert(0, str(ROOT / 'scripts'))
        import build_share_pages as b
        g = json.loads((ROOT / 'data/resurfacing/groups.json').read_text())['returns_list']
        held = sum(1 for x in g if x['shape'] == 'sharp')
        d = b.ROUTES['phoenix'][1]
        self.assertIn('%d times' % len(g), d); self.assertIn('Only %d held' % held, d)
        n = json.loads((ROOT / 'data/atlas/concentration.json').read_text())['entities']['domain']['count']
        self.assertIn(format(n, ','), b.ROUTES['home'][1])
        r = json.loads((ROOT / 'data/rings.json').read_text())
        d = b.ROUTES['rings'][1]
        self.assertIn('%d themes' % len(r['themes']), d); self.assertIn('%d years' % len(r['years']), d)


if __name__ == '__main__': unittest.main()
