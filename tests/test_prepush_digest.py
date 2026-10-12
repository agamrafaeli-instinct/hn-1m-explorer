import pathlib, subprocess, sys, tempfile, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'scripts'))
import prepush_digest as p

def git(d, *a): subprocess.run(['git', *a], cwd=d, check=True, capture_output=True)

class Digest(unittest.TestCase):
    def setUp(self):
        self.t = tempfile.TemporaryDirectory(); self.d = pathlib.Path(self.t.name)
        git(self.d, 'init', '-q'); (self.d / 'a.txt').write_text('one\n'); git(self.d, 'add', '.')
    def tearDown(self): self.t.cleanup()
    def test_missing_marker_runs_everything(self):
        self.assertFalse(p.matches(self.d))
    def test_marker_matches_same_files(self):
        (self.d / p.MARK).write_text(p.digest(self.d) + '\n')
        self.assertTrue(p.matches(self.d))
    def test_marker_file_does_not_change_the_digest(self):
        a = p.digest(self.d); (self.d / p.MARK).write_text('x\n'); self.assertEqual(a, p.digest(self.d))
    def test_changed_file_makes_marker_stale(self):
        (self.d / p.MARK).write_text(p.digest(self.d) + '\n')
        (self.d / 'a.txt').write_text('two\n')
        self.assertFalse(p.matches(self.d))
    def test_new_file_makes_marker_stale(self):
        (self.d / p.MARK).write_text(p.digest(self.d) + '\n')
        (self.d / 'b.txt').write_text('new\n')
        self.assertFalse(p.matches(self.d))

if __name__ == '__main__': unittest.main()
