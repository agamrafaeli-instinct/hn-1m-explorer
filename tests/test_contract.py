import pathlib, subprocess, sys, tempfile, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'scripts'))
import contract as c

def man(total=100, rows=(60, 40), last=500, new=10, mx=500):
    return {'total_rows': total, 'daily_update': {'retention_rows': total, 'last_scanned_id': last, 'new_rows': new},
            'chunks': [{'path': 'a%d' % i, 'rows': r, 'max_id': mx - i} for i, r in enumerate(rows)]}
ARCH = lambda rows=100: {'files': [{'name': 'stories-2026.parquet', 'rows': rows}]}

class Contract(unittest.TestCase):
    def breaks(self, new, old=None, na=None, oa=None): return c.check(new, old or man(), na, oa)[0]
    def test_good_day_passes(self): self.assertEqual(self.breaks(man(last=520, mx=520)), [])
    def test_window_size_change_breaks(self): self.assertTrue(any(b.startswith('1') for b in self.breaks(man(total=99, rows=(60, 39)))))
    def test_rows_must_add_up(self): self.assertTrue(any(b.startswith('2') for b in self.breaks(man(rows=(60, 30)))))
    def test_scan_going_back_breaks(self): self.assertTrue(any(b.startswith('3') for b in self.breaks(man(last=400))))
    def test_highest_id_going_back_breaks(self): self.assertTrue(any(b.startswith('3') for b in self.breaks(man(mx=400))))
    def test_new_rows_out_of_range_breaks(self):
        for n in (-1, 200001, None, 'x'): self.assertTrue(any(b.startswith('4') for b in self.breaks(man(new=n))), n)
    def test_zero_new_rows_is_only_a_warning(self):
        bad, warn = c.check(man(new=0), man()); self.assertEqual(bad, []); self.assertEqual(len(warn), 1)
    def test_duplicate_chunk_path_breaks(self):
        m = man(); m['chunks'][1]['path'] = 'a0'; self.assertTrue(any(b.startswith('6') for b in self.breaks(m)))
    def test_archive_loss_breaks(self):
        self.assertTrue(any(b.startswith('5') for b in self.breaks(man(), None, ARCH(90), ARCH(100))))
        self.assertTrue(any('disappeared' in b for b in self.breaks(man(), None, {'files': []}, ARCH())))
    def test_archive_growth_passes(self): self.assertEqual(self.breaks(man(), None, ARCH(120), ARCH(100)), [])

class Retry(unittest.TestCase):
    SH = str(pathlib.Path(__file__).resolve().parents[1] / 'scripts/retry.sh')
    def run_retry(self, fails, n=3):
        with tempfile.TemporaryDirectory() as d:
            f = pathlib.Path(d) / 'count'
            cmd = 'c=$(cat %s 2>/dev/null || echo 0); echo $((c+1)) > %s; [ $c -ge %d ]' % (f, f, fails)
            r = subprocess.run(['bash', self.SH, str(n), 'bash', '-c', cmd], env={'RETRY_PAUSE': '0', 'PATH': '/usr/bin:/bin'}, capture_output=True, text=True)
            return r.returncode, int(f.read_text())
    def test_transient_failure_passes_after_retry(self): self.assertEqual(self.run_retry(2), (0, 3))
    def test_first_try_pass_runs_once(self): self.assertEqual(self.run_retry(0), (0, 1))
    def test_gives_up_after_n(self): self.assertEqual(self.run_retry(5), (1, 3))

if __name__ == '__main__': unittest.main()

class Quarantine(unittest.TestCase):
    def test_bad_day_is_reverted_and_report_kept(self):
        sh = str(pathlib.Path(__file__).resolve().parents[1] / 'scripts/quarantine.sh')
        with tempfile.TemporaryDirectory() as d:
            d = pathlib.Path(d); run = lambda *a: subprocess.run(a, cwd=d, check=True, capture_output=True, text=True)
            run('git', 'init', '-q'); (d / 'data').mkdir(); (d / 'data/m.json').write_text('good\n')
            run('git', '-c', 'user.name=t', '-c', 'user.email=t@t', 'add', '-A'); run('git', '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'good')
            (d / 'data/m.json').write_text('bad day\n'); (d / 'data/new.csv').write_text('x'); (d / 'contract.txt').write_text('BREAK 1 something\n')
            r = subprocess.run(['bash', sh, 'contract.txt'], cwd=d, env={'DRY_RUN': '1', 'PATH': '/usr/bin:/bin'}, capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual((d / 'data/m.json').read_text(), 'good\n'); self.assertFalse((d / 'data/new.csv').exists())
            self.assertEqual((d / 'contract.txt').read_text(), 'BREAK 1 something\n')
