import csv, hashlib, json, pathlib, sys, tempfile, unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from prepare_data import build, NAMES
from update_daily import update

class DailyTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.root=pathlib.Path(self.tmp.name)
        raw=self.root/'raw.jsonl'
        raw.write_text('\n'.join(json.dumps({'id':i,'time':i*100,'type':'story','by':'author','title':'comma, quote " Unicode 🦊','text':'first\nsecond','score':i,'descendants':i+1}) for i in range(1,21)))
        build([raw],self.root,650,{'api':'fixture'},20); raw.unlink()
    def tearDown(self): self.tmp.cleanup()
    def manifest(self): return json.loads((self.root/'data/manifest.json').read_text())
    def rows(self):
        rows=[]
        for c in self.manifest()['chunks']:
            p=self.root/c['path']; self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),c['sha256']); self.assertLessEqual(p.stat().st_size,650)
            with p.open(newline='') as f: rows.extend(list(csv.DictReader(f)))
        return rows
    def getter(self,upper,items):
        return lambda path: upper if path=='maxitem' else items.get(int(path.split('/')[1]))
    def test_add_retention_summary_idempotence(self):
        before=self.manifest(); items={21:{'id':21,'time':2100,'type':'comment','text':'new\ntext'},22:{'id':22,'time':2200,'type':'story','score':100,'descendants':10}}
        update(self.root,2,20,self.getter(22,items))
        rows=self.rows(); self.assertEqual([int(r['id']) for r in rows],list(range(22,2,-1))); self.assertEqual(len(rows),20)
        after=self.manifest(); self.assertTrue(set(c['path'] for c in before['chunks']) & set(c['path'] for c in after['chunks']))
        summary=json.loads((self.root/'data/summary.json').read_text()); self.assertEqual(summary['totals']['score_sum'],sum(range(3,21))+100)
        snapshot={p.name:p.read_bytes() for p in (self.root/'data').iterdir()}
        self.assertFalse(update(self.root,2,20,self.getter(22,items)))
        self.assertEqual(snapshot,{p.name:p.read_bytes() for p in (self.root/'data').iterdir()})
    def test_concentration_recomputed_after_retention(self):
        update(self.root,2,20,self.getter(21,{21:{'id':21,'time':2100,'type':'story','by':'new-author','url':'https://new.example/item','title':'Astronomy astronomy telescope','score':500,'descendants':80}}))
        summary=json.loads((self.root/'data/summary.json').read_text())
        c=summary['concentration']
        self.assertEqual(c['totals'],{'posts':20,'points':sum(range(2,21))+500,'comments':sum(range(3,22))+80})
        self.assertEqual(c['entities']['author']['top'][0]['name'],'new-author')
        self.assertEqual(c['entities']['word']['top'][0]['posts'],1)
        self.assertEqual(c['entities']['domain']['top'][0]['name'],'new.example')
        self.assertEqual(sum(r['posts'] for r in c['cyclic']['hour']),20)
        self.assertEqual(c['type']['story']['posts'],20)
    def test_secret_patterns_redacted_before_csv_and_summary(self):
        credential='gh'+'p_'+'A'*36
        update(self.root,2,21,self.getter(21,{21:{'id':21,'time':2100,'type':'story','title':credential,'text':'example '+credential,'url':'https://example.com/'+credential,'score':1000}}))
        for p in (self.root/'data').iterdir():
            self.assertNotIn(credential,p.read_text())
        row=self.rows()[0]; self.assertEqual(row['title'],'[REDACTED-SECRET]')
        self.assertEqual(self.manifest()['daily_update']['redacted_strings_this_run'],3)
        summary=json.loads((self.root/'data/summary.json').read_text())
        self.assertEqual(summary['top_posts'][0]['title'],'[REDACTED-SECRET]')
    def test_failure_does_not_mutate(self):
        before={p.name:p.read_bytes() for p in (self.root/'data').iterdir()}
        def fail(path):
            if path=='maxitem': return 21
            raise RuntimeError('outage')
        with self.assertRaises(RuntimeError): update(self.root,2,20,fail)
        self.assertEqual(before,{p.name:p.read_bytes() for p in (self.root/'data').iterdir()})
    def test_null_id_retried_even_when_maxid_unchanged(self):
        update(self.root,2,20,self.getter(21,{})); self.assertEqual(self.manifest()['daily_update']['unavailable_ids'],[21])
        update(self.root,2,20,self.getter(21,{21:{'id':21,'time':2100,'type':'comment'}}))
        self.assertEqual(int(self.rows()[0]['id']),21); self.assertEqual(self.manifest()['daily_update']['unavailable_ids'],[])
    def test_nonchronological_id_and_missing_time(self):
        update(self.root,2,25,self.getter(22,{21:{'id':21,'time':1050,'type':'comment'},22:{'id':22,'deleted':True}}))
        rows=self.rows(); self.assertEqual(len(rows),22)
        self.assertEqual([int(r['id']) for r in rows][9:12],[11,21,10]); self.assertEqual(int(rows[-1]['id']),22)
    def test_corrupt_chunk_rejected(self):
        p=self.root/self.manifest()['chunks'][0]['path']; p.write_bytes(p.read_bytes()+b'x')
        with self.assertRaisesRegex(ValueError,'integrity'): update(self.root,2,20,self.getter(21,{}))
    def test_invalid_id_rejected(self):
        with self.assertRaisesRegex(ValueError,'different'): update(self.root,2,20,self.getter(21,{21:{'id':99}}))
    def test_catchup_guard(self):
        with self.assertRaisesRegex(ValueError,'safety bound'): update(self.root,2,20,self.getter(999999,{}))
    def test_interleaving_splits_existing_chunk(self):
        update(self.root,2,25,self.getter(22,{21:{'id':21,'time':1750,'type':'comment'},22:{'id':22,'time':1650,'type':'comment'}}))
        ids=[int(r['id']) for r in self.rows()]; self.assertEqual(len(set(ids)),22)
        self.assertEqual(ids[:7],[20,19,18,21,17,22,16])

if __name__=='__main__': unittest.main()
