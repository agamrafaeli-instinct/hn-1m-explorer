import json, pathlib, re, unittest
ROOT = pathlib.Path(__file__).resolve().parents[1]

class EssayTables(unittest.TestCase):
    def test_top_sites_table_matches_the_data(self):
        h = (ROOT / 'index.html').read_text()
        top = json.loads((ROOT / 'data/atlas/concentration.json').read_text())['entities']['domain']['top'][:10]
        rows = re.search(r'Ten sites with the most points.*?<tbody>(.*?)</tbody>', h, re.S).group(1)
        got = re.findall(r'<tr><td>(?:<a [^>]*>)?([^<]*)(?:</a>)?</td><td>([\d,]+)</td><td>([\d,]+)</td></tr>', rows)
        self.assertEqual(got, [(x['name'], format(x['posts'], ','), format(round(x['points'] / 1000), ',')) for x in top])

    def test_sharp_returns_table_matches_the_data(self):
        h = (ROOT / 'index.html').read_text()
        sharp = [x for x in json.loads((ROOT / 'data/resurfacing/groups.json').read_text())['returns_list'] if x['shape'] == 'sharp']
        rows = re.search(r'Sharp returns.*?<tbody>(.*?)</tbody>', h, re.S).group(1)
        got = re.findall(r'<tr><td>(?:<a [^>]*>)?([^<]*)(?:</a>)?</td><td>[^<]*</td><td>[^<]*</td><td>(\d+)</td></tr>', rows)
        self.assertEqual(got, [(x['subject'], str(x['burial'])) for x in sorted(sharp, key=lambda x: x['subject'])])
        self.assertEqual(len(sharp), 13)


class RingsThemeLinks(unittest.TestCase):
    def test_linked_themes_are_the_one_word_themes_in_the_data(self):
        h = (ROOT / 'index.html').read_text()
        linked = re.search(r'rg_find">(.*?)</p>', h, re.S).group(1)
        words = re.findall(r'href="#/explore\?q=([a-z]+)"', linked)
        themes = json.loads((ROOT / 'data/rings.json').read_text())['themes']
        one = [t['label'].lower() for t in themes if t['terms'] == t['label']]
        self.assertEqual(words, one)
