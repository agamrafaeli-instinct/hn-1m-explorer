import pathlib, re, unittest, urllib.parse
ROOT = pathlib.Path(__file__).resolve().parents[1]
EXPLORE_KEYS = {'q', 'by', 'domain', 'from', 'to', 'type', 'min', 'week', 'sort', 'whole'}

class InPageLinks(unittest.TestCase):
    def known_routes(self):
        r = (ROOT / 'router.js').read_text()
        views = re.search(r"const views = \[([^\]]*)\]", r).group(1)
        names = set(re.findall(r"'(\w+)'", views)) | set(re.findall(r"p\[0\] === '(\w+)'", r))
        return names | {''}

    def test_every_hash_link_goes_to_a_known_route(self):
        known, bad = self.known_routes(), []
        h = (ROOT / 'index.html').read_text()
        ids = set(re.findall(r'id="([^"]+)"', h))
        for m in re.findall(r'href="(#[^"]*)"', h):
            if not m.startswith('#/'):
                if m[1:] not in ids: bad.append(m)
                continue
            path, _, query = m[2:].partition('?')
            first = path.split('/')[0]
            if first not in known: bad.append(m)
            if first == 'explore' and query:
                keys = {k for k, _ in urllib.parse.parse_qsl(query)}
                if not keys <= EXPLORE_KEYS: bad.append(m)
        self.assertEqual(bad, [])

if __name__ == '__main__':
    unittest.main()
