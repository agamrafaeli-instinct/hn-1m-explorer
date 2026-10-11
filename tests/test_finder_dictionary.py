import os, sys, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))
import finder_dictionary as d

TITLES = ['React 19 is out', 'Why I left React.js', 'The reactor leak report', 'Reacting to criticism', 'Show HN: a reactjs table', 'Python tips'] + ['React tip %d' % i for i in range(30)]

class Dict(unittest.TestCase):
    def test_matches_aliases_and_near_misses(self):
        r = d.build('react', 'React', r'\breact(\.js|js)?\b', TITLES)
        self.assertEqual(r['matches'], 33)
        self.assertEqual({a['text'] for a in r['aliases']}, {'react', 'react.js', 'reactjs'})
        self.assertIn('The reactor leak report', r['sample_near_misses'])
        self.assertNotIn('Python tips', r['sample_near_misses'])
    def test_exclusions(self):
        r = d.build('react', 'React', r'\breact(\.js|js)?\b', TITLES, exclusions=[r'react 19'])
        self.assertEqual(r['matches'], 32)
    def test_samples_are_capped_and_stable(self):
        a = d.build('react', 'React', r'\breact\b', TITLES); b = d.build('react', 'React', r'\breact\b', list(reversed(TITLES)))
        self.assertLessEqual(len(a['sample_matches']), 20)
        self.assertEqual(a['sample_matches'], b['sample_matches'])
    def test_bursts(self):
        rows = [('zig', 60, 100, 1000, 100000), ('rust', 60, 6000, 1000, 100000), ('tiny', 5, 0, 1000, 100000), ('newthing', 40, 0, 1000, 100000)]
        got = [x['term'] for x in d.burst_terms(rows)]
        self.assertEqual(got, ['newthing', 'zig'])
if __name__ == '__main__': unittest.main()
