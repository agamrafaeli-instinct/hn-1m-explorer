import sys,pathlib,json,requests,concurrent.futures,duckdb
sys.path.insert(0,str(pathlib.Path(__file__).parent));from query import query
months=['2023-11','2023-12','2025-12','2026-01']
c=duckdb.connect();c.execute('LOAD httpfs');out=[]
for m in months:
 rows=query(f"SELECT id,title,time,score,descendants FROM hackernews.hackernews WHERE type='story' AND dead=0 AND deleted=0 AND formatDateTime(time,'%Y-%m')='{m}' AND modulo(id,100)=0 ORDER BY id LIMIT 12")
 ids=[r['id'] for r in rows];u=f'https://huggingface.co/datasets/open-index/hacker-news/resolve/main/data/{m[:4]}/{m}.parquet'
 hf={r[0]:{'score':r[1],'descendants':r[2]} for r in c.execute('SELECT id,score,descendants FROM read_parquet(?) WHERE id IN ('+','.join(map(str,ids))+')',[u]).fetchall()}
 def live(a):
  b=requests.get('https://hacker-news.firebaseio.com/v0/item/'+str(a['id'])+'.json',timeout=30).json() or {}
  return {'month':m,'origin':a,'hf':hf.get(a['id']),'live':{k:b.get(k) for k in ['score','descendants']}}
 out.extend(concurrent.futures.ThreadPoolExecutor(6).map(live,rows));print(m,len(rows),flush=True)
pathlib.Path('/tmp/deep-research/hn-history/score-comparison-fixed.json').write_text(json.dumps(out,indent=2))
for m in months:
 r=[x for x in out if x['month']==m];print(m,'score',sum(x['origin']['score'] for x in r),sum(x['live']['score'] or 0 for x in r),'desc',sum(x['origin']['descendants'] for x in r),sum(x['live']['descendants'] or 0 for x in r),'hf origin equal',sum(x['hf']=={'score':x['origin']['score'],'descendants':x['origin']['descendants']} for x in r))
