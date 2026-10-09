import csv, json, sys, tempfile, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import verdict_log as v

T = [{'name': 'h002-night-owls', 'verdict': 'supported', 'confidence': 'weak'},
     {'name': 'h001-weekday-rhythm', 'verdict': 'refuted', 'confidence': 'strong'},
     {'name': 'h003-broken', 'error': 'x'}]

class T1(unittest.TestCase):
    def setUp(self):
        self.log = Path(tempfile.mkdtemp()) / 'verdicts' / 'log.csv'
    def rows(self):
        return list(csv.DictReader(self.log.open()))
    def test_append_creates_file_with_header_and_skips_errors(self):
        self.assertEqual(v.append(T, self.log, '2026-10-10'), 2)
        r = self.rows()
        self.assertEqual([x['card_id'] for x in r], ['h001', 'h002'])
        self.assertEqual(r[1], {'date': '2026-10-10', 'card_id': 'h002', 'verdict': 'supported', 'confidence': 'weak'})
    def test_same_day_rerun_adds_nothing(self):
        v.append(T, self.log, '2026-10-10')
        self.assertEqual(v.append(T, self.log, '2026-10-10'), 0)
        self.assertEqual(len(self.rows()), 2)
    def test_next_day_adds_rows_and_new_card_only_adds_itself(self):
        v.append(T, self.log, '2026-10-10')
        self.assertEqual(v.append(T, self.log, '2026-10-11'), 2)
        v.append(T + [{'name': 'h004-new', 'verdict': 'inconclusive', 'confidence': 'inconclusive'}], self.log, '2026-10-11')
        self.assertEqual(len(self.rows()), 5)

if __name__ == '__main__':
    unittest.main()
