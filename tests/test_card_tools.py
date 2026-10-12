import copy, json, pathlib, sys, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'scripts'))
import upgrade_card as u

OLD = {'id': 'h300', 'title': 't', 'audience': 'engineers', 'verdicts': [
    {'when': {'op': '>=', 'value': 1.5}, 'verdict': 'supported', 'confidence': 'strong'},
    {'when': {'op': '>=', 'value': 1.1}, 'verdict': 'supported', 'confidence': 'weak'},
    {'when': {'op': '<=', 'value': 0.9}, 'verdict': 'refuted', 'confidence': 'strong'},
    {'else': True, 'verdict': 'inconclusive', 'confidence': 'inconclusive'}]}

class Upgrade(unittest.TestCase):
    def test_new_id_replaces_and_overrides(self):
        n = u.upgraded(OLD, 'h500', {'audience': 'curious readers'}, strong=1.6, weak=1.2, refute=0.8)
        self.assertEqual((n['id'], n['replaces'], n['audience']), ('h500', 'h300', 'curious readers'))
        self.assertEqual([v['when']['value'] for v in n['verdicts'] if v.get('when')], [1.6, 1.2, 0.8])
    def test_old_card_is_not_touched(self):
        before = copy.deepcopy(OLD); u.upgraded(OLD, 'h500', {'audience': 'x'}, strong=2); self.assertEqual(OLD, before)
    def test_no_overrides_keeps_thresholds(self):
        n = u.upgraded(OLD, 'h500'); self.assertEqual(n['verdicts'], OLD['verdicts'])

if __name__ == '__main__': unittest.main()
