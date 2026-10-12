import pathlib, sys, tempfile, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'scripts'))
import inputs_hash as h

class Hash(unittest.TestCase):
    def setUp(self):
        self.t = tempfile.TemporaryDirectory(); self.r = pathlib.Path(self.t.name)
        (self.r / 'data/archive').mkdir(parents=True); (self.r / 'data/archive/a.parquet').write_bytes(b'one')
        (self.r / 'data/history').mkdir(parents=True); (self.r / 'data/history/daily.csv').write_text('d\n')
        for o in h.OUTPUTS: (self.r / o).write_text('{}')
    def tearDown(self): self.t.cleanup()
    def store(self, month='2026-10'): (self.r / h.STORE).write_text(h.digest(self.r, month) + '\n')
    def test_no_stored_hash_runs(self): self.assertFalse(h.matches(self.r, '2026-10'))
    def test_same_inputs_skip(self): self.store(); self.assertTrue(h.matches(self.r, '2026-10'))
    def test_changed_input_runs(self):
        self.store(); (self.r / 'data/archive/a.parquet').write_bytes(b'two'); self.assertFalse(h.matches(self.r, '2026-10'))
    def test_new_archive_file_runs(self):
        self.store(); (self.r / 'data/archive/b.parquet').write_bytes(b'x'); self.assertFalse(h.matches(self.r, '2026-10'))
    def test_new_month_runs(self): self.store(); self.assertFalse(h.matches(self.r, '2026-11'))
    def test_missing_output_runs(self):
        self.store(); (self.r / 'data/saga.json').unlink(); self.assertFalse(h.matches(self.r, '2026-10'))

if __name__ == '__main__': unittest.main()
