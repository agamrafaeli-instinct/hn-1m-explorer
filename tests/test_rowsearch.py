import pathlib, sys, unittest
R = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(R / 'scripts'))
import patch_duckdb_worker as P

class RowSearch(unittest.TestCase):
    def test_shipped_worker_is_patched(self):
        t = (R / 'vendor/duckdb/worker.js').read_text()
        self.assertEqual(t.count(P.PATCHED), 1)
        self.assertEqual(t.count(P.STOCK), 0)

    def test_patch_fails_when_stock_string_is_missing(self):
        with self.assertRaises(SystemExit):
            P.patch('a different engine version')
        with self.assertRaises(SystemExit):
            P.patch(P.STOCK + P.STOCK)
        self.assertIn(P.PATCHED, P.patch('x' + P.STOCK + 'y'))

    def test_engine_loads_only_on_search(self):
        h = (R / 'history.js').read_text()
        self.assertNotIn('duck.mjs', h)
        self.assertNotIn('duckdb', h)
        r = (R / 'rowsearch.js').read_text()
        self.assertIn('MAXY = 3', r)
        self.assertLess(r.index('function engine'), r.index("import('./vendor/duckdb/duck.mjs')"))
        self.assertIn('dropFile', r)

if __name__ == '__main__':
    unittest.main()
