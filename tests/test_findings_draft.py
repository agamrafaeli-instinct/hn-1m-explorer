import glob, json, os, re, sys, unittest
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
import findings_draft as fd

def lookup(d, path, key):
    node = d
    for p in path.split('.'): node = node[p]
    return [x for x in node if x['key'] == key]

class Draft(unittest.TestCase):
    def check_line(self, week, d, ln):
        self.assertLessEqual(len(ln['text'].split()), fd.MAX_WORDS, ln['text'])
        for w in fd.BANNED: self.assertNotIn(w, ln['text'].lower())
        hit = lookup(d, ln['path'], ln['key'])
        self.assertEqual(len(hit), 1, ln['source_line'])
        it = hit[0]
        self.assertIn('%g' % it['this'], ln['text'] if 'shares' not in ln['path'] else ln['source_line'])
        if 'expected' in it: self.assertIn('%g' % it['expected'], ln['text'])
        self.assertIn(ln['source'], ln['source_line'])
    def test_all_real_weeks(self):
        files = sorted(glob.glob(os.path.join(ROOT, 'data/compare/20*-W*.json')))
        self.assertTrue(files)
        for f in files:
            week = os.path.basename(f)[:-5]; d = json.load(open(f)); r = fd.draft_week(week, d)
            for aud, lines in r['audiences'].items():
                self.assertLessEqual(len(lines), fd.MAX_PER_AUDIENCE)
                for ln in lines:
                    if ln.get('quiet'): self.assertEqual(ln['text'], fd.QUIET)
                    else: self.check_line(week, d, ln)
    def test_ranking_and_quiet(self):
        d = {'audiences': {'engineers': {'rose': [
            {'key': 'a', 'label': 'A', 'diff': 10, 'expected': 25, 'this': 35},
            {'key': 'b', 'label': 'B', 'diff': 20, 'expected': 25, 'this': 45}], 'fell': [], 'new': [], 'shares': []},
            'vcs': {'rose': [], 'fell': [], 'new': [], 'shares': []}, 'geeks': {}}}
        r = fd.draft_week('2026-W41', d)['audiences']
        self.assertEqual(r['engineers'][0]['key'], 'b')
        self.assertTrue(r['vcs'][0]['quiet']); self.assertTrue(r['geeks'][0]['quiet'])
    def test_share_flag_and_new(self):
        d = {'audiences': {'engineers': {'rose': [], 'fell': [], 'new': [{'key': 'x', 'label': 'X', 'this': 12}],
              'shares': [{'key': 's', 'label': 'S share', 'this': .3, 'last': .2, 'avg4': .21, 'usual_change': .02, 'state': 'rose'},
                         {'key': 't', 'label': 'T', 'this': .3, 'last': .3, 'avg4': .3, 'usual_change': .02, 'state': 'steady'}]}}}
        lines = fd.draft_week('2026-W41', d)['audiences']['engineers']
        self.assertEqual([l['key'] for l in lines], ['x', 's'])
if __name__ == '__main__': unittest.main()
