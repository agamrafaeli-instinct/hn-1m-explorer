import requests,json,pathlib,time
BASE='https://sql-clickhouse.clickhouse.com'
def query(q,name=None):
 r=requests.get(BASE,auth=('demo',''),params={'query':q+' FORMAT JSON'},timeout=115)
 
 if not r.ok:raise RuntimeError(r.text[:1800])
 x=r.json()
 if 'exception' in x:raise RuntimeError(x['exception'])
 if name:pathlib.Path('/tmp/deep-research/hn-history/'+name+'.json').write_text(json.dumps(x))
 def cast(v):
  if isinstance(v,dict):return {k:cast(w) for k,w in v.items()}
  if isinstance(v,list):return [cast(w) for w in v]
  if isinstance(v,str) and v.lstrip('-').isdigit():return int(v)
  return v
 return cast(x['data'])
if __name__=='__main__':
 q="SELECT id,title,time,score,descendants FROM hackernews.hackernews WHERE type='story' AND (toYYYYMM(time) IN (202311,202312,202512,202601)) AND modulo(id,1000)=0 ORDER BY time LIMIT 40"
 x=query(q,'score-fixed-sample')
 out=[]
 for a in x:
  b=requests.get('https://hacker-news.firebaseio.com/v0/item/'+str(a['id'])+'.json',timeout=20).json()
  out.append({'archive':a,'firebase':{k:b.get(k) for k in ['id','score','descendants','time']}})
 pathlib.Path('/tmp/deep-research/hn-history/score-comparison.json').write_text(json.dumps(out,indent=2))
 print([(a['archive']['id'],a['archive']['score'],a['firebase'].get('score')) for a in out][:12])
