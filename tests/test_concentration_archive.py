import pathlib, sys, tempfile, unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
import duckdb
from concentration_archive import build

class ConcArchiveTests(unittest.TestCase):
    def test_stories_only_no_authors(self):
        with tempfile.TemporaryDirectory() as t:
            r=pathlib.Path(t); (r/'data/archive').mkdir(parents=True)
            duckdb.connect().execute("COPY (SELECT 1::TINYINT AS type, i::UINTEGER AS id, to_timestamp(1700000000+i*3600) AS time, 'Rust and python '||i AS title, 'https://www.site'||mod(i,3)||'.com/x' AS url, (i*i) AS score, i AS descendants FROM range(1,41) t(i)) TO '%s' (FORMAT PARQUET)"%(r/'data/archive/stories-2023.parquet'))
            c,p=build(r)
            self.assertEqual(c['totals']['posts'],40); self.assertEqual(c['totals']['points'],sum(i*i for i in range(1,41)))
            self.assertEqual(c['entities']['author']['count'],0); self.assertEqual(c['entities']['domain']['count'],3)
            self.assertEqual(len(c['top_posts']),30); self.assertEqual(c['top_posts'][0]['score'],1600)
            self.assertEqual(c['type']['story']['posts'],40); self.assertTrue(p.exists())
if __name__=='__main__': unittest.main()
