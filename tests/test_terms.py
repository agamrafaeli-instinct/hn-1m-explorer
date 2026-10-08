import sqlite3, sys, unittest, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'scripts'))
import terms

DAY = 86400
MON = 1785110400  # 2026-07-27 00:00 UTC, a Monday

class TermsTest(unittest.TestCase):
    def test_weekly_baskets(self):
        db = sqlite3.connect(':memory:')
        db.execute('CREATE TABLE items(id INTEGER PRIMARY KEY,type TEXT,time INTEGER,title TEXT,score INTEGER,dead INTEGER,deleted INTEGER)')
        rows = [(1, 'story', MON - DAY, 'before window start week', 1, 0, 0),
                (2, 'story', MON + 3600, 'Show HN: a Rust parser', 10, 0, 0),
                (3, 'story', MON + 2 * DAY, 'Plain story', 4, 0, 0),
                (4, 'comment', MON + 2 * DAY, None, None, 0, 0),
                (5, 'story', MON + 8 * DAY, 'Quantum chip', 7, 0, 0),
                (6, 'story', MON + 13 * DAY + 86000, 'Weird ancient thing', 3, 0, 0)]
        db.executemany('INSERT INTO items VALUES(?,?,?,?,?,?,?)', rows)
        w = terms.compute(db)['weekly']
        self.assertEqual([r['week'] for r in w], ['2026-07-27'])  # only the complete week between first and last item
        self.assertEqual((w[0]['stories'], w[0]['points']), (2, 14))
        self.assertEqual((w[0]['newsys_stories'], w[0]['newsys_points'], w[0]['newsys_rest_stories']), (1, 10, 1))

if __name__ == '__main__': unittest.main()
