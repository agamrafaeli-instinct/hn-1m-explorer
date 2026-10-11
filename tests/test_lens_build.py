import glob, json, os, random, sys, tempfile, unittest
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
import lens_build as lb

def weekly():
    return {os.path.basename(f)[:-5]: json.load(open(f)) for f in sorted(glob.glob(os.path.join(ROOT, 'data/weekly/20*-W*.json')))}

class Lens(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.mkdtemp(); lb.run(os.path.join(ROOT, 'data/weekly'), cls.tmp); cls.W = weekly()
        cls.index = json.load(open(cls.tmp + '/index.json'))
    def entry(self, i): return json.load(open('%s/%s.json' % (self.tmp, i)))
    def test_sampled_domains_match_weekly_files(self):
        doms = [e['id'] for e in self.index['entries'] if e['kind'] == 'domain']
        random.Random(1).shuffle(doms)
        for d in doms[:5]:
            e = self.entry(d)
            for row in e['weeks']:
                v = self.W[row['week']]['domains'].get(d)
                self.assertEqual(row['stories'], v[0] if v else None); self.assertEqual(row['points'], v[1] if v else None)
                self.assertEqual(row['small'], bool(v and v[0] < lb.FLOOR))
            for s in e['top_stories']:
                self.assertIn(s['id'], [t['id'] for t in self.W[s['week']]['top_stories'] if t['domain'] == d])
    def test_names_match_weekly_files(self):
        for e0 in [x for x in self.index['entries'] if x['kind'] == 'name'][:5]:
            e = self.entry(e0['id'])
            for row in e['weeks']:
                self.assertEqual(row['mentions'], self.W[row['week']]['vcs']['watchlist']['mentions'].get(e['label']))
    def test_rules(self):
        for e in self.index['entries']:
            if e['kind'] == 'domain':
                n = sum(1 for w in self.W.values() if e['id'] in w['domains'])
                self.assertGreaterEqual(n, lb.MIN_WEEKS)
        self.assertEqual(self.index['weeks'], sorted(self.W))
    def test_entry_files_small(self):
        for f in glob.glob(self.tmp + '/*.json'):
            if not f.endswith('index.json'): self.assertLess(os.path.getsize(f), 10 * 1024, f)
    def test_committed_files_are_current(self):
        out = tempfile.mkdtemp(); lb.run(os.path.join(ROOT, 'data/weekly'), out)
        for f in glob.glob(out + '/*.json'):
            self.assertEqual(open(f).read(), open(os.path.join(ROOT, 'data/lens', os.path.basename(f))).read(), os.path.basename(f))
if __name__ == '__main__': unittest.main()
