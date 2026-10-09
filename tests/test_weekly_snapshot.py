import csv, datetime as dt, json, pathlib, shutil, sys, tempfile, unittest
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
import weekly_snapshot as ws

MON = int(dt.datetime(2026, 7, 27, tzinfo=dt.timezone.utc).timestamp())  # Monday, ISO week 2026-W31
DAY = 86400
COLS = ['id', 'type', 'by', 'time', 'title', 'url', 'domain', 'score', 'descendants', 'text', 'dead', 'deleted']

def row(i, typ, t, title='', domain='', score='', desc='', dead=0, deleted=0):
    return dict(id=i, type=typ, by='u', time=t, title=title, url='', domain=domain, score=score, descendants=desc, text='', dead=dead, deleted=deleted)

def make_root(rows):
    tmp = pathlib.Path(tempfile.mkdtemp()); (tmp / 'data').mkdir(); (tmp / 'scripts').mkdir(); (tmp / 'docs').mkdir()
    shutil.copy(ROOT / 'scripts/geeks.py', tmp / 'scripts/geeks.py')
    (tmp / 'docs/curious-round2-plan.json').write_text(json.dumps({'tests': [{'key': 'space', 'pattern': r'\b(space|nasa)\b'}]}))
    with open(tmp / 'data/posts-1.csv', 'w', newline='') as fh:
        w = csv.DictWriter(fh, COLS); w.writeheader(); w.writerows(rows)
    (tmp / 'data/manifest.json').write_text(json.dumps({'generated_at': 'x', 'total_rows': len(rows), 'chunks': [{'path': 'data/posts-1.csv'}]}))
    return tmp

def fixture():
    r = [row(1, 'story', MON - DAY, 'before the week', 'a.com', 5, 0),                      # partial week before: skipped
         row(2, 'story', MON + 3600, 'Show HN: a Rust parser', 'github.com', 10, 4),
         row(3, 'story', MON + 2 * DAY, 'Plain story about space', 'nasa.gov', 4, 1),
         row(4, 'comment', MON + 2 * DAY),
         row(5, 'story', MON + 3 * DAY, 'Dead story rust', 'x.com', 99, 9, dead=1),
         row(6, 'story', MON + 3 * DAY, 'No score story', 'x.com', '', ''),
         row(7, 'story', MON + 8 * DAY, 'Quantum chip', 'b.com', 7, 0),                     # second week
         row(8, 'story', MON + 13 * DAY + 86000, 'Weird ancient thing', 'c.com', 3, 0),    # last item: second week is complete
         row(9, 'story', MON + 14 * DAY + 5, 'Third week partial', 'c.com', 1, 0)]
    return make_root(r)

class WeeklySnapshotTest(unittest.TestCase):
    def test_only_complete_weeks_and_numbers(self):
        root = fixture(); snaps = ws.build(root)
        self.assertEqual(sorted(snaps), ['2026-W31', '2026-W32'])  # week before and week after are partial
        s = snaps['2026-W31']
        self.assertEqual(s['stories'], {'stories': 3, 'points': 14, 'comments': 5, 'hit10': 1})  # dead story left out, missing score counts 0
        self.assertEqual(s['stories_missing_score'], 1)
        self.assertEqual((s['items']['comment'], s['items']['dead'], s['items']['total']), (1, 1, 5))
        self.assertEqual(s['baskets']['newsys']['stories'], 1); self.assertEqual(s['baskets']['newsys']['points'], 10)
        self.assertEqual(s['baskets']['showhn']['stories'], 1); self.assertEqual(s['baskets']['space']['stories'], 1)
        self.assertEqual(s['baskets']['newsys']['audience'], 'engineers'); self.assertEqual(s['baskets']['deeptech']['audience'], 'vcs')
        self.assertEqual(s['top_stories'][0]['id'], 2); self.assertEqual(s['kind'], 'weekly')
        self.assertEqual(snaps['2026-W32']['baskets']['deeptech']['stories'], 1)

    def test_never_overwrites_and_index(self):
        root = fixture(); first = ws.build(root); saved, skipped = ws.save(root, first)
        self.assertEqual((saved, skipped), (['2026-W31', '2026-W32'], []))
        path = root / 'data/weekly/2026-W31.json'; before = path.read_text()
        changed = ws.build(root); changed['2026-W31']['stories']['points'] = 12345
        saved, skipped = ws.save(root, changed)
        self.assertEqual((saved, skipped), ([], ['2026-W31', '2026-W32'])); self.assertEqual(path.read_text(), before)
        idx = json.loads((root / 'data/weekly/index.json').read_text())
        self.assertEqual([w['week'] for w in idx['weeks']], ['2026-W31', '2026-W32'])

    def test_main_skips_saved_weeks(self):
        root = fixture(); ws.main(['--root', str(root)])
        (root / 'data/weekly/2026-W32.json').unlink()
        ws.main(['--root', str(root)])  # saves only the missing week
        self.assertEqual(len(list((root / 'data/weekly').glob('2026-W??.json'))), 2)

    def test_backfill_is_labelled(self):
        root = fixture(); s = ws.build(root, backfill=True)['2026-W31']
        self.assertEqual(s['kind'], 'backfill'); self.assertIn('not saved at the time', s['backfill_note'])

    def test_iso_label_at_year_end(self):
        self.assertEqual(ws.iso_label(dt.date(2026, 12, 28)), '2026-W53'); self.assertEqual(ws.iso_label(dt.date(2027, 1, 4)), '2027-W01')

    def test_basket_names_match_repo_definitions(self):
        b = ws.load_baskets(ROOT); self.assertTrue({'newsys', 'deeptech', 'weird', 'showhn', 'askhn', 'space', 'questions'} <= set(b))

if __name__ == '__main__': unittest.main()
