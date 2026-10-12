import pathlib, unittest
R = pathlib.Path(__file__).resolve().parents[1]

class NoWindowCopy(unittest.TestCase):
    def test_pages_do_not_name_a_window_as_scope(self):
        for f in ('index.html', 'story.js', 'app.js', 'history.js', 'README.md', 'compare.js', 'hypotheses.js', 'weekly.js', 'finder.js', 'lesson.js', 'CONTRIBUTING.md'):
            t = (R / f).read_text().lower()
            for bad in ('rolling window', '1,000,000 rows', '1m items', 'held here, from', 'newest-1m', 'last 1,000,000', 'top 1m', '1m posts', '1m hacker news'):
                self.assertNotIn(bad, t, f + ' names a window as scope: ' + bad)

if __name__ == '__main__': unittest.main()
