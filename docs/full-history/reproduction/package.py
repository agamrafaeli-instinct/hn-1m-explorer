import pathlib,json,calendar,collections,datetime,sys
P=pathlib.Path('/tmp/deep-research/hn-history');O=P/'output';D=P/'delivery/data/full_history';D.mkdir(parents=True,exist_ok=True)
cards=json.loads((P/'frozen-card-contracts.json').read_text());patterns=json.loads((O/'definitions.json').read_text())['patterns']
cache={}
def rows(k):
 if k not in cache:
  by=collections.defaultdict(dict)
  for r in json.loads((O/(k+'.json')).read_text()):by[r['month']][r['side']]=r
  for sides in by.values():
   for s in ['match','rest']:sides.setdefault(s,{key:([0]*7 if key.startswith('wd_') else 0) for key in ['stories','points','comments','hit10','score_stories','comment_stories','paired_points','paired_comments','trimmed_points','trimmed_stories','t_points','t_stories','wd_stories','wd_points','wd_comments']})
  cache[k]=by
 return cache[k]
def div(a,b):return a/b if b else None
def metric(r,f,p=None):return div(r.get(f,0),r.get(p,0)) if p else r.get(f,0)
def entry(m,a,b,an=None,ad=None,bn=None,bd=None):
 return dict(label=m,a=a,b=b,ratio=div(a,b) if a is not None and b is not None else None,a_numerator=an,a_denominator=ad,b_numerator=bn,b_denominator=bd,partial=m in ['2006-10','2026-10'])
cyc=collections.defaultdict(list)
for r in json.loads((O/'cyclic.json').read_text()):cyc[r['month']].append(r)
def domrows(k):
 by=collections.defaultdict(list)
 for r in json.loads((O/(k+'_domains.json')).read_text()):by[r['month']].append(r)
 return by
doms={'geeks_weird':domrows('geeks_weird'),'vc_union':domrows('vc_union')}
manifest=[]
for c in cards:
 n=int(c['id'][1:]);chk=c['check'];src=chk['source'];out=[];definition='';k=None
 if n<=8:
  definition='All item types, including dead/deleted, valid timestamps. Within-month UTC '+('weekday counts normalized per calendar occurrence; equal-weight contrast of original weekday groups.' if 'weekday' in chk['path'] else 'hour totals; equal-weight contrast of original hour groups.')
  for m,rr in sorted(cyc.items()):
   size=7 if 'weekday' in chk['path'] else 24;v=[0]*size
   for r in rr:v[r['weekday'] if size==7 else r['hour']]+=r[chk['field']]
   if size==7:
    y,mo=map(int,m.split('-'));days=[datetime.date(y,mo,d) for d in range(1,calendar.monthrange(y,mo)[1]+1) if (m!='2006-10' or d>=9) and (m!='2026-10' or d<=8)]
    counts=collections.Counter(d.weekday() for d in days);v=[div(x,counts[i]) for i,x in enumerate(v)]
   aa=chk['group_a']['indices'];bb=chk['group_b']['indices'];a=sum(v[i] for i in aa)/len(aa);b=sum(v[i] for i in bb)/len(bb);out.append(entry(m,a,b))
 elif 9<=n<=11:k=['terms_newsys','terms_deeptech','terms_weird'][n-9]
 elif 100<=n<=114:
  k='vc_'+(['datacenters','gpu','neurobio','aerospace','solar','robotics'][(n-100)//2] if n<112 else 'union')
 elif 120<=n<=134:
  key=['weird','science','retro','history','puzzle','showhn','askhn','boring'][chk.get('group_a',{}).get('indices',[0])[0]] if chk['path']=='baskets' else 'weird';k='geeks_'+key
 elif 135<=n<=149:k='r2_'+chk['path'].split('.')[-1]
 else:continue
 if k:
  by=rows(k);definition='Live stories only (type=story, dead=0, deleted=0), case-insensitive original title regex. Matching and complementary stories from identical month and archive. Calendar-month bins replace weekly bins for this descriptive strip only.'
  for m,side in sorted(by.items()):
   a=side['match'];b=side['rest'];total=a['stories']+b['stories'];af=bf='points';ap=bp='stories'
   if n==9 or (100<=n<112 and n%2==0) or n==147:
    af='stories';ap=None;av=div(a['stories'],total);out.append(entry(m,av,None,a['stories'],total));continue
   if n in [124,138,149,112]:af=bf='comments';ap=bp='comment_stories' if n in [138,149] else 'stories'
   if n in [125,139,140,141]:af=bf='paired_comments' if n>=135 else 'comments';ap=bp='paired_points' if n>=135 else 'points'
   if n in [123,135,142,146]:af=bf='hit10';ap=bp='score_stories' if n>=135 else 'stories'
   if n in [136,144]:af=bf='trimmed_points';ap=bp='trimmed_stories'
   if n==121:af=bf='t_points';ap=bp='t_stories'
   if n==113:af='trimmed_points';ap='trimmed_stories'
   if n in [127,128,137,143,148]:
    f='wd_points' if n==127 else 'wd_stories';den='wd_stories' if n==127 else None
    v=[div(a[f][i],a[den][i] if den else a['wd_stories'][i]+b['wd_stories'][i]) for i in range(7)]
    def mean(ids):
     t=[v[i] for i in ids if v[i] is not None];return sum(t)/len(t) if len(t)==len(ids) else None
    out.append(entry(m,mean([5,6]),mean(list(range(5)))));continue
   if n==122:
    top=doms[k].get(m,[]);r=top[0] if top else {};a={**a,'points':a['points']-r.get('points',0),'stories':a['stories']-r.get('stories',0)}
   if n==114:
    dd=doms[k].get(m,[]);top=sum(r['points'] for r in dd[:5]);outside=a['points']-top;out.append(entry(m,outside,top,outside,1,top,1));continue
   out.append(entry(m,metric(a,af,ap),metric(b,bf,bp),a.get(af),a.get(ap),b.get(bf),b.get(bp)))
  if n in [121,122,113,114,136,144]:definition+=' Robustness removal is recalculated within each month, not the original global/weekly window. '+('Top 1% ceil on known-score stories per side.' if n in [136,144] else 'Original rounding retained; ties for domain rank use lexical hostname.')
 score_sensitive=any(x in chk.get('per_label','') for x in ['point','comment','hit','lift']) or chk.get('field') in ['points','hit10','lift']
 obj={'schema':1,'id':c['id'],'title':c['title'],'source_url':'https://sql.clickhouse.com/','archive_url':'https://huggingface.co/datasets/open-index/hacker-news','query_endpoint':'https://sql-clickhouse.clickhouse.com','coverage':'2006-10-09 to 2026-10-08 UTC inclusive','labels':[r['label'] for r in out],'rows':out,'definition':definition,'pattern':patterns.get(k),'original_check':chk,'original_verdicts':c['verdicts'],'verdict_policy':'No new verdict. Original window verdict preserved. Monthly strip is exploratory/descriptive; bin changes are not equivalent tests.','quality':{'engagement_snapshot_unvalidated':score_sensitive,'warning':'Scores and descendants are stale in deterministic live cross-checks. Do not treat these as final engagement or compare regimes causally.' if score_sensitive else 'Title counts are archive occurrences, not adoption. Archive completeness not independently established.'},'a_label':chk['group_a']['label'],'b_label':chk['group_b']['label']}
 if n==9 or (100<=n<112 and n%2==0) or n==147:obj['a_label']='Monthly matching-title share';obj['b_label']=None
 path=D/(c['id']+'.json');path.write_text(json.dumps(obj,separators=(',',':'))+'\n');manifest.append({'id':c['id'],'path':'data/full_history/'+path.name,'rows':len(out),'quality':obj['quality']})
(D/'index.json').write_text(json.dumps({'schema':1,'cards':manifest},indent=2))
print('PACKAGED',len(manifest),'cards',sum(p.stat().st_size for p in D.glob('*.json')),'bytes')
