import sys, pathlib, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'scripts'))
import watch_points as w
class T(unittest.TestCase):
    def test_reports_once(self):
        hits = [{'objectID': '1'}, {'objectID': '2'}]
        self.assertEqual(w.new_hits(hits, {'1': 5}), [{'objectID': '2'}])
        self.assertEqual(w.new_hits(hits, {'1': 5, '2': 6}), [])
