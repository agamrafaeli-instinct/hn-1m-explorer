import pathlib, subprocess, sys, tempfile, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'scripts'))
import build_graph as g

class Graph(unittest.TestCase):
    def setUp(self):
        self.t = tempfile.TemporaryDirectory(); self.r = pathlib.Path(self.t.name)
        for f, c in {'index.html': 'a', 'app.js': 'b', 'notes.md': 'n', 'data/x.csv': 'd', 'hypotheses/h1.json': '{}', 'tests/ui.test.mjs': 'u', 'scripts/perf.mjs': 'p', 'data/budgets.json': '{}', 'source.json': 's'}.items():
            (self.r / f).parent.mkdir(parents=True, exist_ok=True); (self.r / f).write_text(c)
        subprocess.run(['git', 'init', '-q'], cwd=self.r, check=True); subprocess.run(['git', 'add', '-A'], cwd=self.r, check=True)
    def tearDown(self): self.t.cleanup()
    def test_no_saved_hash_runs(self): self.assertFalse(g.unchanged('ui', self.r))
    def test_same_inputs_skip(self): g.record('ui', self.r); self.assertTrue(g.unchanged('ui', self.r))
    def test_site_file_change_runs_both_steps(self):
        g.record('ui', self.r); g.record('budgets', self.r); (self.r / 'app.js').write_text('c')
        self.assertFalse(g.unchanged('ui', self.r)); self.assertFalse(g.unchanged('budgets', self.r))
    def test_card_change_runs(self):
        g.record('ui', self.r); (self.r / 'hypotheses/h1.json').write_text('{"a":1}'); self.assertFalse(g.unchanged('ui', self.r))
    def test_docs_and_data_do_not_matter(self):
        g.record('ui', self.r); (self.r / 'notes.md').write_text('x'); (self.r / 'data/x.csv').write_text('y'); self.assertTrue(g.unchanged('ui', self.r))
    def test_each_step_has_its_own_input(self):
        g.record('ui', self.r); g.record('budgets', self.r); (self.r / 'scripts/perf.mjs').write_text('q')
        self.assertTrue(g.unchanged('ui', self.r)); self.assertFalse(g.unchanged('budgets', self.r))
    def test_source_json_is_not_an_input(self):
        self.assertNotIn('source.json', g.inputs('ui', self.r))

if __name__ == '__main__': unittest.main()
