import json, re, unittest, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent

class HypLinks(unittest.TestCase):
    def test_one_word_list_matches_topic_matchers(self):
        ts = json.loads((ROOT / 'data/topic_series.json').read_text())['topics']
        want = sorted(t['id'] for t in ts if re.fullmatch(r'\\b[A-Za-z0-9]+\\b', t['matcher']))
        m = re.search(r"const ONE_WORD = \[([^\]]*)\]", (ROOT / 'hypotheses.js').read_text())
        have = sorted(re.findall(r"'([^']+)'", m.group(1)))
        self.assertEqual(have, want)

if __name__ == '__main__': unittest.main()
