import pathlib, sys, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'scripts'))
import check_roadmap as c

class Roadmap(unittest.TestCase):
    def test_title_pattern(self):
        m = c.PAT.match('[Epic] - Tally - Running hypothesis scoreboard'); self.assertEqual(m.group(1), 'Tally')
    def test_section_round_trip(self):
        s = c.section({'Tally': (63, 'Scoreboard'), 'Atlas': (109, 'Cover all')})
        self.assertEqual(c.listed(s), {'Tally', 'Atlas'})
    def test_missing_marker_lists_nothing(self):
        self.assertEqual(c.listed('no markers here'), set())

if __name__ == '__main__': unittest.main()
