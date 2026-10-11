import hashlib, json, pathlib, sys, tempfile, unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
import duckdb
from prepare_data import build
import update_daily, archive_append
from update_daily import update

class ArchiveAppendTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.root=pathlib.Path(self.tmp.name)
        raw=self.root/'raw.jsonl'
        raw.write_text('\n'.join(json.dumps({'id':i,'time':1700000000+i*100,'type':'story','by':'a','title':'t%d'%i,'score':i,'descendants':1}) for i in range(1,21)))
        build([raw],self.root,650,{'api':'fixture'},20); raw.unlink()
        a=self.root/'data/archive'; a.mkdir()
        db=duckdb.connect()
        db.execute("COPY (SELECT type_ AS type, id, time_ AS time, title, url, score, descendants FROM (SELECT 1::TINYINT AS type_, 1::UINTEGER AS id, to_timestamp(1700000100) AS time_, 't1' AS title, NULL AS url, 1 AS score, 1 AS descendants)) TO '%s' (FORMAT PARQUET)"%(a/'stories-2023.parquet'))
        data=(a/'stories-2023.parquet').read_bytes()
        (a/'manifest.json').write_text(json.dumps({'version':1,'files':[{'name':'stories-2023.parquet','rows':1,'first_id':1,'last_id':1,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'kind':'stories','year':2023}]}))
    def tearDown(self): self.tmp.cleanup()
    def getter(self,upper,items): return lambda p: upper if p=='maxitem' else items.get(int(p.split('/')[1]))
    def snap(self): return {str(p.relative_to(self.root)):p.read_bytes() for p in (self.root/'data').rglob('*') if p.is_file()}
    def ids(self): return [r[0] for r in duckdb.connect().execute("SELECT id FROM read_parquet(?) ORDER BY id",[str(self.root/'data/archive/stories-2023.parquet')]).fetchall()]
    def test_leaving_stories_are_archived_once(self):
        items={21:{'id':21,'time':1700002100,'type':'story','title':'new','score':3},22:{'id':22,'time':1700002200,'type':'comment','text':'c'}}
        update(self.root,2,20,self.getter(22,items))
        self.assertEqual(self.ids(),[1,2])
        m=json.loads((self.root/'data/archive/manifest.json').read_text())['files'][0]
        p=self.root/'data/archive/stories-2023.parquet'
        self.assertEqual((m['rows'],m['last_id'],m['bytes']),(2,2,p.stat().st_size)); self.assertEqual(m['sha256'],hashlib.sha256(p.read_bytes()).hexdigest())
        update(self.root,2,20,self.getter(22,items)); self.assertEqual(self.ids(),[1,2])
    def test_failed_append_leaves_window_and_archive_unchanged(self):
        before=self.snap(); real=archive_append.stage
        def boom(*a,**k): raise RuntimeError('append failed')
        archive_append.stage=boom
        try:
            with self.assertRaises(RuntimeError): update(self.root,2,20,self.getter(21,{21:{'id':21,'time':1700002100,'type':'story','title':'new'}}))
        finally: archive_append.stage=real
        self.assertEqual(before,self.snap())

if __name__=='__main__': unittest.main()
