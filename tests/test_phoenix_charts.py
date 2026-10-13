import pathlib, re, sys, unittest
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import phoenix_charts as P

class PhoenixCharts(unittest.TestCase):
    def test_page_holds_the_three_charts_built_from_the_data(self):
        h = (ROOT / 'index.html').read_text()
        m = re.search(r'<!--PHOENIX_CHARTS-->(.*?)<!--/PHOENIX_CHARTS-->', h, re.S)
        self.assertTrue(m, 'run scripts/phoenix_charts.py')
        ms = P.months_list()
        import json
        rets = {r['subject']: r for r in json.loads((ROOT / 'data/resurfacing/groups.json').read_text())['returns_list'] if r['kind'] == 'term'}
        self.assertEqual(m.group(1), ''.join(P.chart(t, ms, rets[t]) for t in P.PICK))
        self.assertEqual(m.group(1).count('<svg'), 3)
        self.assertEqual(m.group(1).count('aria-label='), 3)
