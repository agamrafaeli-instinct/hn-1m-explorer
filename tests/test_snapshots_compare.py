import pathlib, sys, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'scripts'))
try:
    from PIL import Image
except ImportError:
    raise unittest.SkipTest("Pillow not installed")
import snapshots_compare as s

class Cmp(unittest.TestCase):
    def img(self, c=(255, 255, 255), size=(40, 40)): return Image.new('RGB', size, c)
    def test_same_image_is_not_changed(self): self.assertEqual(s.compare(self.img(), self.img())[1], '')
    def test_no_saved_image_is_reported(self): self.assertEqual(s.compare(None, self.img())[1], 'no saved image')
    def test_size_change_is_reported(self): self.assertIn('size', s.compare(self.img(), self.img(size=(40, 50)))[1])
    def test_changed_pixels_are_reported_with_diff(self):
        b = self.img(); b.paste((0, 0, 0), (0, 0, 20, 40)); pct, why, red = s.compare(self.img(), b)
        self.assertEqual(why, 'pixels differ'); self.assertAlmostEqual(pct, 50.0); self.assertIsNotNone(red)
    def test_tiny_change_under_threshold_is_ignored(self):
        b = self.img(size=(100, 100)); b.putpixel((1, 1), (0, 0, 0)); self.assertEqual(s.compare(self.img(size=(100, 100)), b)[1], '')

if __name__ == '__main__': unittest.main()
