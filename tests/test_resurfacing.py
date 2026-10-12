import sys, pathlib, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'scripts'))
import resurfacing as r

def series(counts, total=1000):
    months = r.month_list('2010-01', '2099-12')[:len(counts)]
    return months, counts, [total] * len(counts)

class Resurfacing(unittest.TestCase):
    def test_one_quiet_spell_and_return(self):
        # 24 active months (50/1000), 14 quiet (1/1000), 12 active again
        m, c, t = series([50] * 24 + [1] * 14 + [50] * 12)
        A, sp = r.detect(m, c, t)
        self.assertAlmostEqual(A, 0.05)
        self.assertEqual(len(sp), 1)
        self.assertEqual(sp[0]['start'], m[24])
        self.assertEqual(sp[0]['quiet_months'], 14)
        self.assertEqual(sp[0]['return_month'], m[38])
        self.assertEqual(sp[0]['burial_months'], 14)

    def test_short_dip_is_not_a_spell(self):
        m, c, t = series([50] * 24 + [1] * 11 + [50] * 12)
        self.assertEqual(r.detect(m, c, t)[1], [])

    def test_never_quiet(self):
        m, c, t = series([50] * 60)
        self.assertEqual(r.detect(m, c, t)[1], [])

    def test_spell_without_return_is_open(self):
        m, c, t = series([50] * 24 + [1] * 20)
        sp = r.detect(m, c, t)[1]
        self.assertEqual(len(sp), 1)
        self.assertIsNone(sp[0]['return_month'])

    def test_single_spike_is_not_a_return(self):
        m, c, t = series([50] * 24 + [1] * 14 + [50, 1, 1, 1, 1, 1] + [1] * 6)
        sp = r.detect(m, c, t)[1]
        self.assertIsNone(sp[0]['return_month'])

    def test_spell_needs_12_active_months_first(self):
        m, c, t = series([50] * 6 + [1] * 14 + [50] * 12)
        self.assertEqual(r.detect(m, c, t)[1], [])

    def test_eligibility(self):
        self.assertFalse(r.eligible([2] * 20))
        self.assertTrue(r.eligible([5] * 20))

if __name__ == '__main__': unittest.main()
