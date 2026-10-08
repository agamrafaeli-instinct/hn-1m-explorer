import json,csv,datetime as dt,collections,re
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer,ENGLISH_STOP_WORDS
from sklearn.decomposition import NMF
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'data/manifest.json').read_text());rows=[]
weeks=['2026-07-27','2026-08-03','2026-08-10','2026-08-17','2026-08-24','2026-08-31','2026-09-07','2026-09-14','2026-09-21','2026-09-28'];train=set(weeks[:5]);hold=set(weeks[5:])
for ch in manifest['chunks']:
 with (ROOT/ch['path']).open(newline='') as f:
  for r in csv.DictReader(f):
   if not r['time'] or r['type']!='story' or r['dead']=='1' or r['deleted']=='1':continue
   d=dt.datetime.fromtimestamp(int(r['time']),dt.timezone.utc).date();w=(d-dt.timedelta(days=d.weekday())).isoformat()
   if w not in train|hold:continue
   rows.append({'id':int(r['id']),'week':w,'title':r['title'],'domain':r['domain'],'url':r['url'],'points':int(r['score'] or 0),'comments':int(r['descendants'] or 0)})
(ROOT/'data/vcs_discovery_rows.json').write_text(json.dumps(rows))
if '--prepare-only' in __import__('sys').argv: __import__('sys').exit(0)
tr=[r for r in rows if r['week'] in train]
vec=TfidfVectorizer(stop_words=list(ENGLISH_STOP_WORDS|set('show ask hn new using use built build just does don like make making work world time years year pdf video live free open source open-source best need way let people human good life future problem project tool tools app apps software data code model models llm llms ai agent agents agentic coding claude google chatgpt openai anthropic github browser local memory terminal web search language python rust game games linux windows api mcp run real engineering intelligence artificial online platform'.split())),ngram_range=(1,2),min_df=6,max_df=.12,max_features=30000,token_pattern=r'(?u)\b[a-zA-Z][a-zA-Z0-9-]{2,}\b')
x=vec.fit_transform([r['title'] for r in tr]);model=NMF(n_components=160,random_state=42,init='nndsvda',max_iter=150);z=model.fit_transform(x);names=vec.get_feature_names_out();out=[]
for i,comp in enumerate(model.components_):
 terms=[names[k] for k in comp.argsort()[-12:][::-1]]
 ix=z[:,i].argsort()[-8:][::-1];examples=[tr[k]['title'] for k in ix]
 out.append(dict(cluster=i,terms=terms,examples=examples))
print(json.dumps(out,indent=2));(ROOT/'data/vcs_discovery_clusters.json').write_text(json.dumps(out,indent=2))
