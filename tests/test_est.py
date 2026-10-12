import os, pathlib, subprocess, sys, tempfile, unittest
S = pathlib.Path(__file__).resolve().parents[1] / 'scripts'
sys.path.insert(0, str(S))
import est

def run(*a, env=None):
    return subprocess.run([sys.executable, str(S / 'est.py'), *a], capture_output=True, text=True, env=env)

class Est(unittest.TestCase):
    def test_no_arguments_prints_usage(self):
        r = run(); self.assertEqual(r.returncode, 1); self.assertIn('usage', r.stderr)
    def test_bad_minutes_say_so(self):
        r = run('est', '1', 'abc'); self.assertEqual(r.returncode, 1); self.assertIn('whole minutes', r.stderr)
    def test_unknown_command_says_so(self):
        r = run('nope'); self.assertEqual(r.returncode, 1); self.assertIn('unknown command', r.stderr)
    def test_minutes_from_body_then_board_hours(self):
        self.assertEqual(est.minutes_of({'content': {'body': 'What. Estimate: 45 min.'}, 'est': None}), 45)
        self.assertEqual(est.minutes_of({'content': {'body': ''}, 'est': {'number': 0.5}}), 30)
        self.assertIsNone(est.minutes_of({'content': {'body': ''}, 'est': None}))
    def test_old_hours_ledger_converts_to_minutes(self):
        t = tempfile.mkdtemp(); p = pathlib.Path(t) / 'e.csv'
        p.write_text('issue,size,estimate_h,start_utc,done_utc,actual_h\n1,M,2.0,a,b,0.5\n')
        old = est.LED; est.LED = str(p)
        try:
            r = est.rows(); self.assertEqual((r[0]['estimate_min'], r[0]['actual_min']), (120, 30))
        finally: est.LED = old

if __name__ == '__main__': unittest.main()
