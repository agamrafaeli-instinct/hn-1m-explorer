import json, pathlib, sys, unittest
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
import weekly_lists as L

class ListsFile(unittest.TestCase):
    def test_version_and_groups(self):
        d = json.loads((ROOT / 'data' / 'lists.json').read_text())
        self.assertEqual(d['list_version'], L.LIST_VERSION)
        for k in ('ai_core', 'themes', 'watchlist', 'press', 'primary', 'hiring_skills'):
            self.assertIn(k, d)
    def test_loaded_shapes(self):
        self.assertIsInstance(L.CASE_SENSITIVE, set)
        self.assertEqual(L.AI_CORE['words'][0], 'ai')
        self.assertTrue(L.WATCHLIST)

if __name__ == '__main__':
    unittest.main()
