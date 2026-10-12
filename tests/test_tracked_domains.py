import json, pathlib, sys, tempfile, unittest
R = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(R / 'scripts'))
import tracked_domains as T, weekly_compare as C

class TrackedList(unittest.TestCase):
    def test_file_has_1000_ranked_domains(self):
        rc, msg = T.check(R); self.assertEqual(rc, 0, msg)
        d = json.loads((R / 'data/tracked_domains.json').read_text())
        self.assertTrue(all(not x[0].startswith('www.') and x[0] == x[0].lower() for x in d['domains']))
        self.assertIn('2025', d['caveat'])
    def test_check_reports_a_missing_file(self):
        self.assertEqual(T.check(tempfile.mkdtemp())[0], 1)
    def test_version_bumps_only_when_the_list_changes(self):
        t = pathlib.Path(tempfile.mkdtemp()); (t / 'data').mkdir()
        rows = [['a.com', 9, 3], ['b.com', 5, 2]]
        self.assertEqual(T.write(t, rows, ['2006-10', '2026-08']), 1)
        self.assertEqual(T.write(t, [['a.com', 10, 3], ['b.com', 6, 2]], ['2006-10', '2026-08']), 1)  # same names, new points
        self.assertEqual(T.write(t, [['a.com', 9, 3], ['c.com', 5, 2]], ['2006-10', '2026-08']), 2)

class TrackedMovers(unittest.TestCase):
    def test_block_keeps_only_tracked_movers(self):
        tr = {'version': 1, 'domains': [['github.com', 9, 9], ['quiet.com', 1, 1]]}
        mk = lambda d, n: {'domains': d, 'shared': {'volume': {'stories_live': n, 'stories_all': n}}, 'stories_live': n}
        w = mk({'github.com': [300, 1], 'other.com': [400, 1]}, 1000); p = mk({'github.com': [100, 1], 'other.com': [100, 1]}, 1000)
        orig = C.total_live; C.total_live = lambda x: 1000
        try: b = C.tracked_block(w, p, tr)
        finally: C.total_live = orig
        self.assertEqual([r['key'] for r in b['rose']], ['github.com']); self.assertEqual(b['fell'], [])
        self.assertEqual((b['version'], b['in_list']), (1, 2))

if __name__ == '__main__': unittest.main()
