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




def fixture2():
    r = [row(0, 'story', MON - DAY, 'before', 'a.com', 1, 0), row(1, 'story', MON + 100, 'Show HN: Claude Code plugin for Rust', 'github.com', 12, 3),
         row(2, 'story', MON + 200, 'Quantum chip raises Series A', 'techcrunch.com', 5, 150),
         row(3, 'story', MON + 300, 'Old thing (2012)', 'example.com', 2, 0),
         row(4, 'story', MON + 400, 'Dead AI story', 'x.com', 9, 0, dead=1),
         row(5, 'comment', MON + 500, '', '', '', ''), row(6, 'comment', MON + 600, '', '', '', '', dead=1),
         row(7, 'story', MON + 8 * DAY, 'Next week', 'a.com', 1, 0),
         row(8, 'story', MON + 13 * DAY + 86000, 'Last item', 'a.com', 1, 0), row(9, 'story', MON + 14 * DAY + 5, 'Partial', 'a.com', 1, 0)]
    # comments carry their text in the "text" column
    byid = {x['id']: x for x in r}
    byid[5]['text'] = 'I use Rust and python every day, AI is fine'; byid[6]['text'] = 'dead comment about ChatGPT'
    r.append(row(10, 'comment', MON + 700, '', '', '', '')); r[-1]['text'] = 'Acme | Backend Engineer | Remote | Python and ML<p>details'
    byid[1]['text'] = 'A plugin'
    return make_root(r)

class V2Test(unittest.TestCase):
    def test_v2_blocks(self):
        s = ws.build(fixture2())['2026-W31']
        self.assertEqual(s['schema_version'], 2); self.assertEqual(s['methods']['list_version'], '1')
        vol = s['shared']['volume']; self.assertEqual((vol['stories_live'], vol['stories_all']), (3, 4)); self.assertEqual((vol['comments_live'], vol['comments_all']), (2, 3))
        ai = s['shared']['ai']['terms']
        self.assertEqual((ai['ai']['story_live'], ai['ai']['story_all']), (0, 1))   # the dead story counts only on the "all" basis
        self.assertEqual((ai['ai']['comment_live'], ai['ai']['comment_all']), (1, 1)); self.assertEqual((ai['chatgpt']['comment_live'], ai['chatgpt']['comment_all']), (0, 1))
        e = s['engineers']
        self.assertEqual(e['languages']['rust'], {'stories': 1, 'comments': 1}); self.assertEqual(e['ai_coding']['claude_code']['stories'], 1)
        self.assertEqual((e['show_hn']['stories'], e['show_hn']['hit10'], e['show_hn']['github']), (1, 1, 1))
        self.assertEqual(e['hiring']['estimated_posts'], 1); self.assertEqual(e['hiring']['skills']['python'], 1); self.assertEqual(e['hiring']['skills']['remote'], 1)
        v = s['vcs']; self.assertEqual(v['themes']['quantum']['stories'], 1); self.assertEqual(v['deal_words']['by_word']['raises'], 1); self.assertEqual(v['deal_words']['by_word']['series'], 1)
        self.assertEqual(v['sources']['press']['stories'], 1)
        g = s['geeks']; self.assertEqual(g['old_year_tag']['stories'], 1); self.assertEqual(g['ai_free']['stories'], 2)  # the Claude Code story is AI
        self.assertEqual(s['shared']['discussion']['stories_100_comments'], 1)

    def test_matcher_whole_words_and_phrases(self):
        m = ws.Matcher({'rust': ws.L.T(['rust']), 'cpp': ws.L.T(phrases=['c++']), 'cc': ws.L.T(phrases=['claude code'])})
        h = lambda t: m.hits(*ws.words(t))
        self.assertEqual(h('Rust-lang and C++ rock'), {'rust', 'cpp'}); self.assertEqual(h('trust the crusty'), set()); self.assertEqual(h('Claude Code is here'), {'cc'})
        self.assertEqual(h('rust_belt'), set())  # underscore joins words, same as a regex \b

    def test_replace_only_older_backfill(self):
        root = fixture2(); d = root / 'data/weekly'; d.mkdir(parents=True)
        (d / '2026-W31.json').write_text(json.dumps({'kind': 'backfill', 'schema_version': 1, 'week': '2026-W31', 'start_utc': 'x', 'saved_at': 'x'}))
        (d / '2026-W32.json').write_text(json.dumps({'kind': 'weekly', 'schema_version': 1, 'week': '2026-W32', 'start_utc': 'x', 'saved_at': 'x'}))
        saved, skipped = ws.save(root, ws.build(root, backfill=True), replace_backfill=True)
        self.assertEqual((saved, skipped), (['2026-W31'], ['2026-W32']))
        self.assertEqual(json.loads((d / '2026-W31.json').read_text())['schema_version'], 2); self.assertEqual(json.loads((d / '2026-W32.json').read_text())['kind'], 'weekly')
        saved, skipped = ws.save(root, ws.build(root, backfill=True), replace_backfill=True)  # same schema now: nothing replaced
        self.assertEqual(saved, [])

if __name__ == '__main__': unittest.main()
