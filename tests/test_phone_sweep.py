import pathlib, subprocess, unittest
R = pathlib.Path(__file__).resolve().parents[1]

class PhoneSweep(unittest.TestCase):
    def test_script_parses(self):
        r = subprocess.run(['node', '--check', str(R / 'scripts/phone_sweep.mjs')], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)
    def test_every_router_screen_is_swept(self):
        t = (R / 'scripts/phone_sweep.mjs').read_text()
        for route in ('#/hypotheses', '#/c/h370', '#/w/engineers/', '#/s/', '#/story', '#/explore', '#/submit', '#/how', '#/lesson', '#/topics', '#/today', '#/l/', '#/t/llm', '#/compare', '#/hypotheses'):
            self.assertIn(route, t, route)
    def test_checklist_names_the_script(self):
        self.assertIn('scripts/phone_sweep.mjs', (R / 'docs/PHONE_CHECKLIST.md').read_text())

if __name__ == '__main__': unittest.main()
