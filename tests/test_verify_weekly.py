import json, pathlib, sys, tempfile, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'scripts'))
import verify_weekly as V

def mk(files):
    t = tempfile.mkdtemp(); d = pathlib.Path(t) / 'data' / 'weekly'; d.mkdir(parents=True)
    for n, c in files.items(): (d / n).write_text(c)
    return t, d

class Verify(unittest.TestCase):
    def test_init_then_ok(self):
        t, d = mk({'2026-W31.json': 'a', '2026-W32.json': 'b'})
        self.assertEqual(V.verify(t, init=True)[0], 0)
        self.assertEqual(len(json.loads((d / 'hashes.json').read_text())['files']), 2)
        self.assertEqual(V.verify(t)[0], 0)
    def test_changed_file_fails(self):
        t, d = mk({'2026-W31.json': 'a'}); V.verify(t, init=True)
        (d / '2026-W31.json').write_text('changed')
        code, m = V.verify(t); self.assertEqual(code, 1); self.assertIn('Changed saved week: 2026-W31.json', m[0])
    def test_missing_file_fails(self):
        t, d = mk({'2026-W31.json': 'a', '2026-W32.json': 'b'}); V.verify(t, init=True)
        (d / '2026-W32.json').unlink()
        code, m = V.verify(t); self.assertEqual(code, 1); self.assertIn('Missing saved week: 2026-W32.json', m[0])
    def test_new_file(self):
        t, d = mk({'2026-W31.json': 'a'}); V.verify(t, init=True)
        (d / '2026-W32.json').write_text('b')
        self.assertEqual(V.verify(t)[0], 1)
        self.assertEqual(V.verify(t, add_new=True)[0], 0)
        self.assertEqual(V.verify(t)[0], 0)
    def test_add_new_never_hides_a_change(self):
        t, d = mk({'2026-W31.json': 'a'}); V.verify(t, init=True)
        (d / '2026-W31.json').write_text('x'); (d / '2026-W32.json').write_text('b')
        self.assertEqual(V.verify(t, add_new=True)[0], 1)
        self.assertNotEqual(json.loads((d / 'hashes.json').read_text())['files']['2026-W31.json'], V.sha(d / '2026-W31.json'))

if __name__ == '__main__': unittest.main()
