import json, os, pathlib, subprocess, sys, tarfile, tempfile, unittest
ROOT = pathlib.Path(__file__).resolve().parent.parent
S = str(ROOT / 'scripts' / 'archive_weekly.py')

def run(cwd, *a): return subprocess.run([sys.executable, S, *a], cwd=cwd, capture_output=True, text=True)

class Archive(unittest.TestCase):
    def setUp(self):
        self.d = tempfile.mkdtemp(); w = pathlib.Path(self.d, 'data/weekly'); w.mkdir(parents=True)
        for n in ('2026-W01', '2026-W02'): (w / (n + '.json')).write_text('{"week":"%s"}' % n)
        import hashlib
        (w / 'hashes.json').write_text(json.dumps({'files': {f.name: hashlib.sha256(f.read_bytes()).hexdigest() for f in w.glob('????-W??.json')}}))
    def test_build_compare_restore(self):
        self.assertEqual(run(self.d, 'build', 'a.tar.gz').returncode, 0)
        self.assertEqual(run(self.d, 'compare', 'a.tar.gz').returncode, 0)
        p = pathlib.Path(self.d, 'data/weekly/2026-W01.json'); p.unlink()
        self.assertEqual(run(self.d, 'restore', 'a.tar.gz', '2026-W01').returncode, 0)
        self.assertEqual(p.read_text(), '{"week":"2026-W01"}')
        self.assertEqual(run(self.d, 'restore', 'a.tar.gz', '2026-W01').returncode, 1)
    def test_compare_flags_difference(self):
        run(self.d, 'build', 'a.tar.gz')
        h = pathlib.Path(self.d, 'data/weekly/hashes.json'); r = json.loads(h.read_text()); r['files']['2026-W03.json'] = 'x'; h.write_text(json.dumps(r))
        o = run(self.d, 'compare', 'a.tar.gz'); self.assertEqual(o.returncode, 1); self.assertIn('2026-W03', o.stdout)

if __name__ == '__main__': unittest.main()
