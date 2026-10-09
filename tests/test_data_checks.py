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
    dc.EXPECTED_ROWS = len(rows)
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
        rows = good_rows(); dc.EXPECTED_ROWS = len(rows) + 1
        tmp = build(rows)
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
        dc.EXPECTED_ROWS = 1_000_000
        res = {n: ok for n, v, ok, l in dc.evaluate(dc.scan(ROOT))}
        self.assertTrue(all(res.values()), res)

if __name__ == '__main__': unittest.main()
