import json, math, pathlib, sys, unittest
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
import weekly_compare as wc


def week(name, start, live=1000, allst=1400, langs=None, core=200, domains=None, watch=None, press=300, primary=500):
    return {'week': name, 'start_utc': start, 'kind': 'backfill', 'end_exclusive_utc': start,
            'shared': {'volume': {'stories_live': live, 'stories_all': allst}, 'ai': {'terms': {'core': {'story_live': core}}}},
            'engineers': {'languages': {k: {'stories': v} for k, v in (langs or {}).items()}, 'show_hn': {'stories': 100}},
            'vcs': {'watchlist': {'mentions': watch or {}}, 'sources': {'press': {'stories': press}, 'primary': {'stories': primary}}},
            'geeks': {'ai_free': {'stories': 700}, 'variety': {'linked_stories': 900, 'distinct_domains': 450}},
            'baskets': {}, 'domains': domains or {}}


class CountRule(unittest.TestCase):
    def test_big_rise_is_flagged(self):  # expected 40 x 1000/1000 = 40; 70 - 40 = 30 >= 8 and >= 3 x sqrt(40) = 19
        self.assertEqual(wc.count_flag(70, 40, 1000, 1000)[0], 'rose')

    def test_big_fall_is_flagged(self):
        self.assertEqual(wc.count_flag(10, 50, 1000, 1000)[0], 'fell')

    def test_below_three_sigma_is_steady(self):  # expected 100, sqrt 10, need 30. 120 is only 20 up.
        self.assertEqual(wc.count_flag(120, 100, 1000, 1000)[0], 'steady')

    def test_below_eight_is_steady(self):  # expected 2, now 9: diff 7 < 8
        self.assertEqual(wc.count_flag(9, 2, 1000, 1000)[0], 'steady')

    def test_small_items_not_rated(self):
        self.assertEqual(wc.count_flag(7, 3, 1000, 1000)[0], 'small')

    def test_expected_uses_share_not_raw_count(self):  # week is 2x bigger: 40 last week means 80 expected
        self.assertEqual(wc.count_flag(85, 40, 2000, 1000)[0], 'steady')
        self.assertEqual(wc.count_flag(140, 40, 2000, 1000)[0], 'rose')


class ShareRule(unittest.TestCase):
    def test_needs_four_prior_weeks(self):
        self.assertEqual(wc.share_flag([.2, .2, .2, .9])[0], 'not_enough_weeks')

    def test_flags_jump_over_three_times_usual_change(self):
        st, avg, usual = wc.share_flag([.20, .21, .20, .21, .30])
        self.assertEqual(st, 'rose'); self.assertAlmostEqual(avg, .205); self.assertGreater(usual, 0)

    def test_small_move_is_steady(self):
        self.assertEqual(wc.share_flag([.20, .22, .20, .22, .21])[0], 'steady')

    def test_flat_history_never_flags(self):  # no usual change to compare with
        self.assertEqual(wc.share_flag([.2, .2, .2, .2, .25])[0], 'steady')


class Whole(unittest.TestCase):
    def build(self):
        ws = [week('w%d' % i, '2026-0%d-01' % (i + 1), langs={'rust': 50}, core=200 + 10 * (i % 2)) for i in range(5)]
        ws.append(week('w5', '2026-06-01', langs={'rust': 90}, core=330, domains={'new.com': [6, 10], 'old.com': [9, 5]},
                       watch={'Acme': 4}))
        ws[4]['domains'] = {'old.com': [9, 5]}
        return ws

    def test_week_with_no_change_says_nothing(self):
        c = wc.compare(self.build(), 3)
        a = c['audiences']
        self.assertEqual([len(a[x][k]) for x in ('engineers', 'vcs', 'geeks') for k in ('rose', 'fell', 'new')], [0] * 9)
        self.assertEqual(c['new_domains'], [])

    def test_rose_new_and_share(self):
        c = wc.compare(self.build(), 5)
        e = c['audiences']['engineers']
        self.assertEqual([r['key'] for r in e['rose']], ['rust'])
        self.assertEqual(e['rose'][0]['expected'], 50.0)
        self.assertEqual([r['key'] for r in c['new_domains']], ['new.com'])   # old.com had 9 last week
        self.assertIsNone(c['new_domains'][0]['last'])
        self.assertEqual([r['key'] for r in c['audiences']['vcs']['new']], ['Acme'])
        ai = [s for s in e['shares'] if s['key'] == 'ai_share'][0]
        self.assertEqual(ai['state'], 'rose'); self.assertAlmostEqual(ai['avg4'], .205)

    def test_first_week_has_no_flags(self):
        c = wc.compare(self.build(), 0)
        self.assertIsNone(c['prev_week'])
        self.assertEqual(c['audiences']['engineers']['rose'], [])

    def test_limits(self):
        ws = [week('a', '2026-01-01', langs={'k%d' % i: 20 for i in range(8)}), week('b', '2026-01-08', langs={'k%d' % i: 120 for i in range(8)})]
        self.assertEqual(len(wc.compare(ws, 1)['audiences']['engineers']['rose']), 3)

    def test_saved_files_reconcile(self):  # real data: output is stable and no week file is touched
        idx = json.loads((ROOT / 'data/weekly/index.json').read_text())
        for e in idx['weeks']:
            p = ROOT / 'data/compare' / (e['week'] + '.json')
            self.assertTrue(p.exists(), p)
            c = json.loads(p.read_text())
            self.assertEqual(c['week'], e['week'])
            for a in ('engineers', 'vcs', 'geeks'):
                self.assertLessEqual(len(c['audiences'][a]['rose']), 3)
                self.assertLessEqual(len(c['audiences'][a]['fell']), 3)
                self.assertLessEqual(len(c['audiences'][a]['new']), 5)
            self.assertLessEqual(len(c['new_domains']), 5)


class ShareBases(unittest.TestCase):
    def test_title_based_shares_use_live_stories(self):
        sh = wc.shares(week('2026-W01', '2026-01-01'))  # live 1000, all 1400
        self.assertAlmostEqual(sh[('geeks', 'ai_free')][1], 0.7)  # 700 / 1000, not 700 / 1400
        self.assertAlmostEqual(sh[('engineers', 'show_hn')][1], 0.1)
        self.assertAlmostEqual(sh[('shared', 'dead')][1], 1 - 1000 / 1400)  # this one uses all stories

    def test_small_counts_show_present_or_absent_only(self):
        rows = wc.bars({'a': {'stories': 40}, 'b': {'stories': 3}, 'c': {'stories': 0}}, small_below=8)
        self.assertEqual([r['value'] for r in rows], [40, 1, 0])
        self.assertEqual([bool(r.get('present_only')) for r in rows], [False, True, True])


if __name__ == '__main__':
    unittest.main()
