import pathlib, sys, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'scripts'))
import copy_lint as c

class Lint(unittest.TestCase):
    def test_each_banned_pattern_fails(self):
        for s in ('Fast \u2014 simple', 'Explore 1M items', 'the last million stories', 'A robust tool', 'Unlock the archive',
                  'Readers cast votes', 'We simply count', 'a comprehensive view', 'in order to see'):
            self.assertTrue(c.hits(s), s)
    def test_repo_name_and_urls_keep_1m(self):
        self.assertEqual(c.hits('See agamrafaeli-instinct/hn-explorer and https://x.io/hn-1M'), [])
    def test_plain_copy_passes(self): self.assertEqual(c.hits('Readers vote it up. Points are low in 2023.'), [])
    def test_skips_tests_data_and_voice_doc(self):
        for p in ('tests/x.py', 'data/a.md', 'docs/VOICE.md', 'scripts/copy_lint.py'): self.assertFalse(c.wanted(p), p)
        self.assertTrue(c.wanted('docs/RUNBOOK.md'))
    def test_lint_reports_file_and_line(self):
        r = c.lint([('a.md', 'fine'), ('b.md', 'bad \u2014 dash')])
        self.assertEqual([x[0] for x in r], ['b.md'])

if __name__ == '__main__': unittest.main()
