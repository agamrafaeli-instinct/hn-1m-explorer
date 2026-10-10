import csv, hashlib, json, pathlib, shutil, sys, tempfile, unittest
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
import data_checks as dc

COLS = ['id', 'type', 'by', 'time', 'title', 'url', 'domain', 'score', 'descendants', 'text', 'dead', 'deleted']

def row(i, typ='comment', t=1000, score='', dead=0, deleted=0):
    return dict(id=i, type=typ, by='u', time=t, title='', url='', domain='', score=score, descendants='', text='', dead=dead, deleted=deleted)

def build(rows, expected_rows=None, tamper=False):
    tmp = pathlib.Path(tempfile.mkdtemp()); (tmp / 'data').mkdir()
    p = tmp / 'data/posts-1.csv'
    with open(p, 'w', newline='') as fh:
        w = csv.DictWriter(fh, COLS); w.writeheader(); w.writerows(rows)
    sha = hashlib.sha256(p.read_bytes()).hexdigest()
    (tmp / 'data/manifest.json').write_text(json.dumps({'total_rows': len(rows), 'chunks': [{'path': 'data/posts-1.csv', 'rows': expected_rows or len(rows), 'sha256': 'bad' if tamper else sha}]}))
    return tmp

def good_rows():
    r = []
    for i in range(100): r.append(row(i, 'comment', 1000 + i * 60))
    for i in range(100, 112): r.append(row(i, 'story', 1000 + i * 60, score=3))
    for i in range(112, 118): r.append(row(i, 'story', 1000 + i * 60, dead=1))
    return r

def run(rows, **kw):
    tmp = build(rows, **kw)
    try: return {n: ok for n, v, ok, l in dc.evaluate(dc.scan(tmp))}
    finally: shutil.rmtree(tmp)

class Checks(unittest.TestCase):
    def test_good_data_passes(self):
        res = run(good_rows()); self.assertTrue(all(res.values()), res)

    def test_duplicate_id_fails(self):
        r = good_rows(); r.append(row(5, 'comment', 1000 + 118 * 60)); self.assertFalse(run(r)['duplicate_ids'])

    def test_unknown_type_fails(self):
        r = good_rows(); r[0]['type'] = 'weird'; self.assertFalse(run(r)['unknown_item_types'])

    def test_missing_time_fails(self):
        r = good_rows(); r[0]['time'] = ''; self.assertFalse(run(r)['missing_or_bad_time'])

    def test_chunk_hash_change_fails(self):
        self.assertFalse(run(good_rows(), tamper=True)['chunk_sha256'])

    def test_chunk_row_count_mismatch_fails(self):
        self.assertFalse(run(good_rows(), expected_rows=5)['chunk_row_counts'])

    def test_wrong_total_fails(self):
        rows = good_rows(); tmp = build(rows)
        m = json.loads((tmp / 'data/manifest.json').read_text()); m['total_rows'] = len(rows) + 1
        (tmp / 'data/manifest.json').write_text(json.dumps(m))
        try: res = {n: ok for n, v, ok, l in dc.evaluate(dc.scan(tmp))}
        finally: shutil.rmtree(tmp)
        self.assertFalse(res['total_rows'])

    def test_dead_share_out_of_range_fails(self):
        r = [x for x in good_rows() if not (x['type'] == 'story' and x['dead'] == 1)]
        self.assertFalse(run(r)['dead_share_stories'])  # 0 dead of 12 stories

    def test_story_score_level_fails(self):
        r = good_rows()
        for x in r:
            if x['type'] == 'story' and x['dead'] == 0: x['score'] = 500
        self.assertFalse(run(r)['median_story_score'])

    def test_long_gap_fails(self):
        r = good_rows(); r[-1]['time'] = 1000 + 10 * 3600 + 118 * 60; self.assertFalse(run(r)['max_gap_hours'])

    def test_live_archive_passes(self):
        if not (ROOT / 'data/manifest.json').exists(): self.skipTest('no data')
        res = {n: ok for n, v, ok, l in dc.evaluate(dc.scan(ROOT))}
        self.assertTrue(all(res.values()), res)


class ArchiveManifest(unittest.TestCase):
    def mk(self, files, held=None):
        tmp = pathlib.Path(tempfile.mkdtemp()); self.addCleanup(shutil.rmtree, tmp)
        (tmp / 'data/archive').mkdir(parents=True)
        (tmp / 'data/archive/manifest.json').write_text(json.dumps({'version': 1, 'files': files}))
        ad = tmp / 'held'; ad.mkdir()
        for name, ids in (held or {}).items():
            with open(ad / name, 'w', newline='') as fh:
                w = csv.writer(fh); w.writerow(['id']); [w.writerow([i]) for i in ids]
        return tmp, ad

    def res(self, tmp, ad):
        return {n: ok for n, v, ok, l in dc.archive_checks(tmp, ad)}

    def entry(self, tmp, ad, name, rows, first, last):
        sha = hashlib.sha256((ad / name).read_bytes()).hexdigest() if (ad / name).exists() else 'x'
        return dict(name=name, rows=rows, first_id=first, last_id=last, sha256=sha, bytes=1)

    def test_empty_manifest_passes(self):
        tmp, ad = self.mk([]); self.assertTrue(all(self.res(tmp, ad).values()))

    def test_good_file_passes(self):
        tmp, ad = self.mk([], {'a.csv': [1, 2, 3]})
        tmp2, _ = tmp, ad
        (tmp / 'data/archive/manifest.json').write_text(json.dumps({'version': 1, 'files': [self.entry(tmp, ad, 'a.csv', 3, 1, 3)]}))
        self.assertTrue(all(self.res(tmp, ad).values()))

    def test_count_mismatch_fails(self):
        tmp, ad = self.mk([], {'a.csv': [1, 2, 3]})
        (tmp / 'data/archive/manifest.json').write_text(json.dumps({'version': 1, 'files': [self.entry(tmp, ad, 'a.csv', 2, 1, 3)]}))
        self.assertFalse(self.res(tmp, ad)['archive_files_checked'])

    def test_hash_mismatch_fails(self):
        tmp, ad = self.mk([], {'a.csv': [1, 2, 3]})
        e = self.entry(tmp, ad, 'a.csv', 3, 1, 3); e['sha256'] = '0' * 64
        (tmp / 'data/archive/manifest.json').write_text(json.dumps({'version': 1, 'files': [e]}))
        self.assertFalse(self.res(tmp, ad)['archive_files_checked'])

    def test_overlap_and_bad_entry_fail(self):
        a = dict(name='a', rows=3, first_id=1, last_id=3, sha256='x', bytes=1)
        b = dict(name='b', rows=3, first_id=3, last_id=5, sha256='x', bytes=1)
        tmp, ad = self.mk([a, b]); self.assertFalse(self.res(tmp, ad)['archive_id_ranges'])
        c = dict(name='c', rows=9, first_id=1, last_id=3, sha256='x', bytes=1)
        tmp, ad = self.mk([c]); self.assertFalse(self.res(tmp, ad)['archive_manifest_entries'])

    def test_parquet_file_hash_and_bytes(self):
        tmp, ad = self.mk([]); (ad / 's.parquet').write_bytes(b'PAR1xxxxPAR1')
        sha = hashlib.sha256((ad / 's.parquet').read_bytes()).hexdigest()
        e = dict(name='s.parquet', rows=3, first_id=1, last_id=3, sha256=sha, bytes=12)
        (tmp / 'data/archive/manifest.json').write_text(json.dumps({'version': 1, 'files': [e]}))
        self.assertTrue(self.res(tmp, ad)['archive_files_checked'])
        e['bytes'] = 99; (tmp / 'data/archive/manifest.json').write_text(json.dumps({'version': 1, 'files': [e]}))
        self.assertFalse(self.res(tmp, ad)['archive_files_checked'])
        e['bytes'] = 12; e['sha256'] = '0' * 64; (tmp / 'data/archive/manifest.json').write_text(json.dumps({'version': 1, 'files': [e]}))
        self.assertFalse(self.res(tmp, ad)['archive_files_checked'])

    def test_missing_manifest_fails(self):
        tmp = pathlib.Path(tempfile.mkdtemp()); self.addCleanup(shutil.rmtree, tmp)
        self.assertFalse(dc.archive_checks(tmp)[0][2])


if __name__ == '__main__':
    unittest.main()
