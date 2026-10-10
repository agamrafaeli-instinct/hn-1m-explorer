import csv, json, pathlib, sys, tempfile, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'scripts'))
import export_weekly as X

C = {'week': '2026-W40', 'start_utc': '2026-09-28', 'kind': 'weekly', 'list_version': '1', 'volume': {'stories_all': 10, 'stories_live': 7, 'comments_all': 90},
     'audiences': {'engineers': {'facts': [{'label': 'Show HN stories', 'value': 3}], 'bars': [{'title': 'Skills', 'unit': 'comments', 'estimated': True, 'rows': [{'label': 'Rust', 'value': 4}]}],
                                 'shares': [{'label': 'AI share', 'this': 0.2, 'last': 0.1, 'avg4': 0.15, 'state': 'steady'}], 'rose': [{'label': 'Postgres', 'this': 49, 'last': 29}], 'fell': [], 'new': []}}}

class Export(unittest.TestCase):
    def test_rows_and_columns(self):
        t = pathlib.Path(tempfile.mkdtemp()); (t / 'data/compare').mkdir(parents=True); (t / 'data/compare/2026-W40.json').write_text(json.dumps(C))
        n, k = X.export(t); self.assertEqual((n, k), (7, 1))
        rs = list(csv.DictReader(open(t / 'data/exports/weekly.csv')))
        self.assertEqual(list(rs[0].keys()), X.COLS)
        self.assertEqual([r['estimate'] for r in rs if r['metric'] == 'Rust'], ['yes'])
        self.assertEqual([r['flag'] for r in rs if r['metric'] == 'Postgres'], ['rose'])

if __name__ == '__main__': unittest.main()
