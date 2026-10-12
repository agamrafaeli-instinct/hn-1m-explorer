import json, pathlib, unittest
ROOT = pathlib.Path(__file__).resolve().parents[1]

class CardTemplate(unittest.TestCase):
    def test_template_matches_example_shape(self):
        ex = json.loads((ROOT / 'docs/examples/h200-example.json').read_text())
        t = json.loads((ROOT / 'docs/examples/card-template.json').read_text())
        self.assertEqual(set(t), set(ex)); self.assertEqual(t['check'], ex['check']); self.assertEqual(t['verdicts'], ex['verdicts'])
    def test_placeholders_are_marked(self):
        t = json.loads((ROOT / 'docs/examples/card-template.json').read_text())
        for k in ('title', 'author', 'hypothesis', 'expect'): self.assertTrue(t[k].startswith('REPLACE'), k)
    def test_contributing_links_template(self):
        self.assertIn('docs/examples/card-template.json', (ROOT / 'CONTRIBUTING.md').read_text())

if __name__ == '__main__': unittest.main()
