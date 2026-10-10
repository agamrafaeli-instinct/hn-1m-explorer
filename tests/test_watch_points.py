import sys, pathlib, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'scripts'))
import watch_points as w
class T(unittest.TestCase):
    def test_reports_once(self):
        hits = [{'objectID': '1'}, {'objectID': '2'}]
        self.assertEqual(w.new_hits(hits, {'1': 5}), [{'objectID': '2'}])
        self.assertEqual(w.new_hits(hits, {'1': 5, '2': 6}), [])


class NewListTest(unittest.TestCase):
    def test_new_list_has_links_and_threshold(self):
        now = 1000000
        a = [{'id': 1, 'title': 'A', 'points': 350, 'comments': 5, 'reported_at': now - 60},
             {'id': 2, 'title': 'B', 'points': 280, 'comments': 5, 'reported_at': now - 60},
             {'id': 3, 'title': 'C', 'points': 400, 'comments': 5, 'reported_at': now - 99999}]
        out = w.new_list(a, now)
        self.assertIn('https://news.ycombinator.com/item?id=1', out)
        self.assertNotIn('| B |', out); self.assertNotIn('| C |', out)
        self.assertIn('item?id=1', w.digest(a, now))
