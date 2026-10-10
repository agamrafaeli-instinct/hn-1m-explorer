"""Guardrails: every card must be an all-time film card. No rolling-window card, no hard-coded fallback card in the page code."""
import glob, json, os, re, unittest
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
def cards():
    for f in sorted(glob.glob(os.path.join(ROOT, 'hypotheses/h*.json'))):
        yield os.path.basename(f), json.load(open(f))
class FilmGuard(unittest.TestCase):
    def test_cards_exist(self):
        self.assertGreater(len(list(cards())), 30)
    def test_card_ids_are_film_ids(self):
        for name, c in cards():
            self.assertGreaterEqual(int(name[1:4]), 300, name + ': only film cards (h300 and up) are allowed')
    def test_only_film_data_source(self):
        for name, c in cards():
            self.assertEqual(c['check']['source'], 'data/film_shares.json', name + ': a card must read the all-time film data, not a rolling window file')
    def test_base_window_is_printed(self):
        for name, c in cards():
            ch = c['check']
            for g in ('group_a', 'group_b'):
                lab = ch[g]['label']
                self.assertTrue('{from}' in lab and '{to}' in lab, '%s: %s label must print its base window ({from} and {to})' % (name, g))
            for g in ('group_a', 'group_b'):
                idx = ch[g]['indices']
                self.assertTrue(idx == 'all' or isinstance(idx, dict), name + ': windows must be all months or last/before_last months, never fixed week lists')
    def test_no_rolling_fields(self):
        for name, c in cards():
            self.assertNotRegex(json.dumps(c['check']), r'weekly|summary\.json|first6|last6', name + ': rolling window reference')
    def test_no_hard_coded_fallback_card(self):
        for f in ('router.js', 'hypotheses.js', 'app.js', 'story.js'):
            t = open(os.path.join(ROOT, f)).read()
            self.assertIsNone(re.search(r"fallback\s*:\s*['\"]h\d+", t), f + ': hard-coded fallback card id')
            self.assertIsNone(re.search(r"startsWith\(['\"]h\d{3}", t), f + ': hard-coded card id lookup')
    def test_stories_point_at_existing_cards(self):
        ids = {n[:4] for n, _ in cards()}
        for f in glob.glob(os.path.join(ROOT, 'stories/h*.json')):
            self.assertIn(os.path.basename(f)[:4], ids, f + ': story for a card that does not exist')
if __name__ == '__main__':
    unittest.main()
