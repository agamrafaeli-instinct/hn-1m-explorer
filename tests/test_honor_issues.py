import sys, pathlib, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'scripts'))
import honor_issues as h

def card(i, failing):
    return {'id': i, 'title': 't ' + i, 'failing': failing, 'group_a_count': 3}
H = {'cards': [card('h001', ['relevant']), card('h002', ['sharp', 'relevant']), card('h003', []), card('h004', ['novel'])]}

class T(unittest.TestCase):
    def test_creates_most_failing_first(self):
        p = h.plan(H, [], 0, cap=2); self.assertEqual([c['id'] for c in p['create']], ['h002', 'h001']); self.assertEqual([c['id'] for c in p['deferred']], ['h004'])
    def test_cap_counts_issues_made_today(self):
        p = h.plan(H, [], 4, cap=5); self.assertEqual(len(p['create']), 1); self.assertEqual(len(p['deferred']), 2)
    def test_second_failure_makes_no_duplicate(self):
        op = [{'number': 7, 'title': h.title(H['cards'][1])}]
        p = h.plan(H, op, 0); self.assertNotIn('h002', [c['id'] for c in p['create']]); self.assertEqual(p['update'], [])
    def test_criteria_change_updates_title(self):
        op = [{'number': 7, 'title': 'Upgrade card h001: sharp'}]
        p = h.plan(H, op, 0); self.assertEqual(p['update'][0][0], 7)
    def test_passing_card_closes_issue(self):
        op = [{'number': 9, 'title': 'Upgrade card h003: novel'}]
        self.assertEqual(h.plan(H, op, 0)['close'][0]['number'], 9)
    def test_body_lists_criteria_and_rule(self):
        b = h.body(H['cards'][1]); self.assertIn('- sharp: needs', b); self.assertIn('group A count', b); self.assertIn('Part of #133.', b)
    def test_no_em_dash(self):
        self.assertNotIn('\u2014', h.body(H['cards'][1]) + ''.join(h.RULE.values()))
if __name__ == '__main__':
    unittest.main()
