import csv, json, pathlib, sys, tempfile, unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
import duckdb
from atlas_aggregates import build

class AtlasTests(unittest.TestCase):
    def test_build_small_archive(self):
        with tempfile.TemporaryDirectory() as t:
            r=pathlib.Path(t); (r/'data/archive').mkdir(parents=True); (r/'data/history').mkdir()
            db=duckdb.connect()
            db.execute("COPY (SELECT 1::TINYINT AS type, i::UINTEGER AS id, to_timestamp(1700000000+i*86400*20) AS time, 'Rust beats python '||i AS title, 'https://www.example.com/'||i AS url, i AS score, 0 AS descendants FROM range(1,9) t(i)) TO '%s' (FORMAT PARQUET)"%(r/'data/archive/stories-2023.parquet'))
            with open(r/'data/history/daily.csv','w',newline='') as f:
                w=csv.writer(f); w.writerow(['date','stories','comments','jobs','polls']); w.writerow(['2023-11-15',3,30,1,0]); w.writerow(['2023-11-16',2,20,0,0])
            idx=build(r,terms=5)
            self.assertEqual(idx['range'],['2023-12','2024-04'])
            m=json.load(open(r/'data/atlas/months.json'))
            nov=[x for x in m['months'] if x['month']=='2023-11'][0]
            self.assertEqual((nov['stories'],nov['comments'],nov['jobs']),(5,50,1))
            self.assertNotIn('top_domains',nov)
            tops=json.load(open(r/'data/atlas/tops-2023.json'))
            self.assertEqual(tops['months']['2023-12']['top_domains'][0][0],'example.com')
            terms=json.load(open(r/'data/atlas/terms-r.json'))
            self.assertIn('rust',terms['terms']); self.assertIn('range',terms)
            self.assertTrue(all('name' in f and 'bytes' in f for f in idx['files']))
if __name__=='__main__': unittest.main()
