import pathlib, sys, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'scripts'))
import failure_report as f

JOBS = {'jobs': [{'name': 'build', 'steps': [{'name': 'Test data pipeline', 'conclusion': 'success'},
                                              {'name': 'Check load time and size against budgets', 'conclusion': 'failure'}]}]}
TIME = 'card   3057 ms  21 req  257 KB OVER: time 3057>3000 ms\n'
SIZE = 'card   2500 ms  21 req  400 KB OVER: size 400>350 KB; time 3100>3000 ms\n'

class Report(unittest.TestCase):
    def test_names_step_log_and_commit(self):
        r = f.build(JOBS, 'line1\n' + TIME, 'abcdef123', 'Fix a thing', 'http://run', 'wf', 1)
        self.assertEqual(r['failing'], ['build / Check load time and size against budgets'])
        for s in ('Check load time and size', 'abcdef1 Fix a thing', 'OVER: time 3057', 'http://run'):
            self.assertIn(s, r['body'])
    def test_time_only_failure_retries_once(self):
        self.assertTrue(f.build(JOBS, TIME, 's' * 7, 'm', 'u', 'w', 1)['retry'])
        self.assertFalse(f.build(JOBS, TIME, 's' * 7, 'm', 'u', 'w', 2)['retry'])
    def test_size_failure_does_not_retry(self):
        self.assertFalse(f.build(JOBS, SIZE, 's' * 7, 'm', 'u', 'w', 1)['retry'])
    def test_other_step_does_not_retry(self):
        j = {'jobs': [{'name': 'build', 'steps': [{'name': 'Test data pipeline', 'conclusion': 'failure'}]}]}
        self.assertFalse(f.build(j, TIME, 's' * 7, 'm', 'u', 'w', 1)['retry'])
    def test_log_is_cut_to_30_lines(self):
        r = f.build(JOBS, '\n'.join('l%d' % i for i in range(100)), 's' * 7, 'm', 'u', 'w', 1)
        self.assertIn('l99', r['body']); self.assertNotIn('l60\n', r['body'])
    def test_missing_job_info_still_makes_a_body(self):
        r = f.build({}, '', 's' * 7, 'm', 'u', 'w', 1); self.assertIn('open the run', r['body'])

if __name__ == '__main__': unittest.main()
