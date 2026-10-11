"""Guardrails for the story finder (#183). Every published story file in data/finder/ must pass these."""
import glob, json, os, re, unittest
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

def stories():
    for f in sorted(glob.glob(os.path.join(ROOT, 'data/finder/20*.json'))):
        yield os.path.basename(f), json.load(open(f))

def check(e):
    err = []
    rows = (e.get('story') or {}).get('rows') or []
    if not rows: err.append('no rows')
    for r in rows:
        if not (r.get('from') and r.get('to')): err.append('row without dates: %s' % r.get('label'))
    sized = [r for r in rows if r.get('total')]
    if sized:
        small = min(sized, key=lambda r: r['total'])
        if small['n'] < 30: err.append('only %d matches in the smaller window' % small['n'])
    if not e.get('dictionary'): err.append('no word list')
    if not re.match(r'^h\d+$', e.get('card_id') or ''): err.append('no card id')
    if not (e.get('rule') or {}).get('set_on'): err.append('no rule date')
    if 'Archive scores' not in e.get('caveat', ''): err.append('no caveat')
    return err

class Guardrails(unittest.TestCase):
    def test_checker_catches_each_failure(self):
        good = {'story': {'rows': [{'from': '2025-08', 'to': '2026-07', 'n': 100, 'total': 5000}, {'from': '2006-10', 'to': '2025-07', 'n': 900, 'total': 90000}]},
                'dictionary': 'x', 'card_id': 'h400', 'rule': {'set_on': '2026-10-11'}, 'caveat': 'Archive scores are low'}
        self.assertEqual(check(good), [])
        import copy
        a = copy.deepcopy(good); a['story']['rows'][0].pop('from'); self.assertTrue(check(a))
        a = copy.deepcopy(good); a['story']['rows'][0]['n'] = 10; self.assertTrue(any('smaller window' in x for x in check(a)))
        a = copy.deepcopy(good); a['dictionary'] = None; self.assertTrue(check(a))
        a = copy.deepcopy(good); a['card_id'] = None; self.assertTrue(check(a))
        a = copy.deepcopy(good); a['rule'] = {}; self.assertTrue(check(a))
    def test_every_published_story(self):
        shown = {(s['term'], s['date']) for s in json.load(open(os.path.join(ROOT, 'data/finder/shown.json')))} if os.path.exists(os.path.join(ROOT, 'data/finder/shown.json')) else set()
        for name, e in stories():
            self.assertEqual(check(e), [], name)
            self.assertIn((e['term'], name[:-5]), shown, name + ' is not in shown.json')
            self.assertTrue(glob.glob(os.path.join(ROOT, 'hypotheses', e['card_id'] + '-*.json')), name + ': card file missing')
            self.assertTrue(os.path.exists(os.path.join(ROOT, e['dictionary'])), name + ': word list file missing')
if __name__ == '__main__': unittest.main()
