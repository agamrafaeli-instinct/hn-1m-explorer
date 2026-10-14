import pathlib, re, unittest
R = pathlib.Path(__file__).resolve().parents[1]
FILES = ('index.html', 'saga.js', 'rings.js', 'story.js', 'app.js', 'rowsearch.js', 'history.js', 'yearzoom.js',
         'lens.js', 'finder.js', 'compare.js', 'lesson.js', 'weekly.js', 'hypotheses.js', 'router.js')
BANNED = [r'\bvotes\b', r'\b1M\b', r'the last million', r'\u2014', r'&mdash;', r'\bdelve\b', r'\bcrucial\b',
          r'\bpivotal\b', r'\bleverag(e|es|ing)\b', r'\bstreamline', r'\bholistic', r'\brobust\b', r'\bseamless',
          r'\bempower', r'\bunlock', r'game-changing', r"we're excited", r'in order to', r'\bsimply\b', r'\bpowerful\b',
          r'\bcomprehensive\b']
BIG_COUNT = re.compile(r'\b\d{1,3}(,\d{3}){2,}\b')

def clean(t):
    t = re.sub(r'https?://\S+', ' ', t)
    t = re.sub(r'agamrafaeli-instinct/hn-explorer|hn-explorer', ' ', t)
    return t

def find_bad(text):
    text = clean(text)
    return [p for p in BANNED if re.search(p, text, re.I if p != r'\b1M\b' else 0)]

class VoiceCopy(unittest.TestCase):
    def test_surfaces_have_no_banned_words(self):
        for f in FILES:
            bad = find_bad((R / f).read_text())
            self.assertEqual(bad, [], f + ' uses banned copy: ' + ', '.join(bad))

    def test_no_hardcoded_big_counts(self):
        for f in FILES:
            m = BIG_COUNT.search(clean((R / f).read_text()))
            self.assertIsNone(m, f + ' hardcodes a large count with no source: ' + (m.group(0) if m else ''))

    def test_test_fails_on_planted_bad_strings(self):
        for s in ('Readers cast votes', 'Explore 1M items', 'A robust tool', 'Fast \u2014 simple', 'Unlock the archive'):
            self.assertTrue(find_bad(s), s)
        self.assertEqual(find_bad('Readers vote it up. See hn-explorer on https://x/1M'), [])

if __name__ == '__main__': unittest.main()
