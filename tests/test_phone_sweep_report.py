import pathlib, sys, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'scripts'))
import phone_sweep_report as p

CLEAN = {'w': 390, 'screen': '#/', 'scroll': 0, 'tap': [], 'unl': [], 'svgs': 0}

class Report(unittest.TestCase):
    def test_zero_findings(self): self.assertEqual(p.build([CLEAN, dict(CLEAN, w=320)])[0], 0)
    def test_counts_and_names_screen(self):
        n, b = p.build([CLEAN, dict(CLEAN, screen='#/rings', scroll=12, tap=['a:x 30x30'])])
        self.assertEqual(n, 1); self.assertIn('#/rings', b); self.assertIn('sideways scroll 12 px', b); self.assertNotIn('**#/**', b)
    def test_never_blocks_wording(self): self.assertIn('never blocks', p.build([dict(CLEAN, svgs=1)])[1])

if __name__ == '__main__': unittest.main()
