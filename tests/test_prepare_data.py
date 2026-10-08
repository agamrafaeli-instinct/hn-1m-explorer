import csv,hashlib,importlib.util,json,pathlib,tempfile,unittest
spec=importlib.util.spec_from_file_location('prep',pathlib.Path(__file__).parents[1]/'scripts/prepare_data.py')
p=importlib.util.module_from_spec(spec); spec.loader.exec_module(p)
class PrepTests(unittest.TestCase):
 def test_round_trip(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=pathlib.Path(tmp); source=root/'raw.jsonl'
   rows=[{'id':i,'time':1000+i,'type':'story','by':'alice','title':'Comma, quote " and 日本語\nnew line','text':'<p>Full body</p>','score':i,'descendants':2,'url':'https://WWW.Example.com/a'} for i in range(1,41)]
   rows.append({'objectID':'50','created_at_i':None,'author':'bob','title':'Algolia','points':None,'num_comments':0,'story_text':'original'})
   source.write_text(''.join(json.dumps(r)+'\n' for r in rows))
   m=p.build([source],root/'out',1024,{'format':'test'},41)
   self.assertEqual(sum(c['rows'] for c in m['chunks']),41); loaded=[]
   for c in m['chunks']:
    f=root/'out'/c['path']; self.assertLessEqual(f.stat().st_size,1024)
    self.assertEqual(hashlib.sha256(f.read_bytes()).hexdigest(),c['sha256'])
    with f.open(newline='') as fp: loaded.extend(csv.DictReader(fp))
   self.assertEqual([int(r['id']) for r in loaded],list(range(40,0,-1))+[50])
   self.assertEqual(loaded[0]['title'],rows[0]['title']); self.assertEqual(loaded[0]['domain'],'example.com')
   self.assertEqual(loaded[-1]['text'],'original'); self.assertEqual(loaded[-1]['time'],'')
   summary=json.loads((root/'out/data/summary.json').read_text())
   self.assertEqual(summary['totals']['missing_time'],1)
 def test_duplicates_rejected(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=pathlib.Path(tmp); f=root/'raw.jsonl'; f.write_text('{"id":1}\n{"id":1}\n')
   with self.assertRaisesRegex(ValueError,'Duplicate'): p.build([f],root/'out',1024,{})
 def test_wrong_count_rejected(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=pathlib.Path(tmp); f=root/'raw.jsonl'; f.write_text('{"id":1}\n')
   with self.assertRaisesRegex(ValueError,'Expected'): p.build([f],root/'out',1024,{},2)
if __name__=='__main__': unittest.main()
