import sys, pathlib, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'scripts'))
import resurfacing_groups as g

class Groups(unittest.TestCase):
    def test_sharp_return(self):
        s = [0.05] * 24 + [0.001] * 14 + [0.06] * 14
        flags, det = g.shape_flags(s, 0.05, 37, 38)
        self.assertIn('sharp', flags); self.assertNotIn('short', flags); self.assertTrue(det)
        self.assertEqual(g.pick_shape(flags), 'sharp')

    def test_short_return_falls_back(self):
        s = [0.05] * 24 + [0.001] * 14 + [0.03] * 4 + [0.001] * 20
        flags, _ = g.shape_flags(s, 0.05, 37, 38)
        self.assertEqual(g.pick_shape(flags), 'short')

    def test_slow_climb(self):
        s = [0.05] * 24 + [0.001] * 14 + [0.015] * 7 + [0.03] * 20
        flags, _ = g.shape_flags(s, 0.05, 37, 45)
        self.assertIn('slow', flags)

    def test_anniversary(self):
        months = ['x'] * 80
        counts = [0] * 80; counts[10] = 9
        totals = [100] * 80
        self.assertTrue(g.anniversary(months, counts, totals, 30, 34))   # 24 months after peak
        self.assertFalse(g.anniversary(months, counts, totals, 30, 38))

    def test_quartiles(self):
        self.assertEqual(g.quartiles([1, 2, 3, 4, 5])['median'], 3)

if __name__ == '__main__': unittest.main()
