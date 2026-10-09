import ast,pathlib,json,sys,hashlib,datetime,math
sys.path.insert(0,str(pathlib.Path(__file__).parent));from query import query
ROOT=pathlib.Path('/tmp/hn-history-repo'); OUT=pathlib.Path('/tmp/deep-research/hn-history/output');OUT.mkdir(exist_ok=True)
def assignment(f,name):
 tree=ast.parse((ROOT/f).read_text())
 for n in tree.body:
  if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id==name for t in n.targets):return ast.literal_eval(n.value)
terms=assignment('scripts/terms.py','BASKETS');geeks=assignment('scripts/geeks.py','BASKETS');themes=assignment('scripts/vcs_holdout.py','THEMES');round2=json.loads((ROOT/'docs/curious-round2-plan.json').read_text())['tests']
patterns={**{'terms_'+k:(v,None) for k,v in terms.items()},**{'geeks_'+k:(v,None) for k,v in geeks.items()},**{'vc_'+k:(v[1],v[2]) for k,v in themes.items()},**{'r2_'+s['key']:(s['pattern'],None) for s in round2}}
patterns['vc_union']=('|'.join('(?:'+v[1]+')' for v in themes.values()),None)
# union built with separate exclusions, not the simplified pattern
(OUT/'definitions.json').write_text(json.dumps({'frozen_at_utc':'2026-10-09T07:34:00Z','patterns':patterns,'cards_sha256':hashlib.sha256(pathlib.Path('/tmp/deep-research/hn-history/frozen-card-contracts.json').read_bytes()).hexdigest()},indent=2))
def lit(x):return "'"+x.replace('\\','\\\\').replace("'","\\'")+"'"
def hit(p):
 a,b=p;v='match(title,'+lit('(?i)'+a)+')'
 if b:v+=' AND NOT match(title,'+lit('(?i)'+b)+')'
 return '('+v+')'
BASE="hackernews.hackernews WHERE time>='2006-10-09 00:00:00' AND time<'2026-10-09 00:00:00'"
LIVE=BASE+" AND type='story' AND dead=0 AND deleted=0"
def run():
 for k,p in patterns.items():
  fn=OUT/(k+'.json')
  if fn.exists():continue
  h=hit(p) if k!='vc_union' else '('+' OR '.join(hit((v[1],v[2])) for v in themes.values())+')'
  q=f'''SELECT month, side, count() stories, sumIf(score,score>=0) points, sumIf(descendants,descendants>=0) comments,
  countIf(score>=10) hit10, countIf(score>=0) score_stories, countIf(descendants>=0) comment_stories,
  sumIf(score,score>=0 AND descendants>=0) paired_points,sumIf(descendants,score>=0 AND descendants>=0) paired_comments,
  arraySum(arraySlice(arrayReverseSort(groupArrayIf(score,score>=0)),toUInt64(ceil(countIf(score>=0)*0.01))+1)) trimmed_points,
  countIf(score>=0)-toUInt64(ceil(countIf(score>=0)*0.01)) trimmed_stories,
  arraySum(arraySlice(arrayReverseSort(groupArray(if(score>=0,score,0))),greatest(1,toUInt64(floor(count()*0.01)))+1)) t_points,
  count()-greatest(1,toUInt64(floor(count()*0.01))) t_stories,
  sumForEach([toUInt64(toDayOfWeek(time)=1),toUInt64(toDayOfWeek(time)=2),toUInt64(toDayOfWeek(time)=3),toUInt64(toDayOfWeek(time)=4),toUInt64(toDayOfWeek(time)=5),toUInt64(toDayOfWeek(time)=6),toUInt64(toDayOfWeek(time)=7)]) wd_stories,
  sumForEach(arrayMap(d->if(toDayOfWeek(time)=d,toInt64(greatest(score,0)),toInt64(0)),range(1,8))) wd_points,
  sumForEach(arrayMap(d->if(toDayOfWeek(time)=d,toInt64(greatest(descendants,0)),toInt64(0)),range(1,8))) wd_comments
  FROM (SELECT *,formatDateTime(time,'%Y-%m') month,if({h},'match','rest') side FROM {LIVE})
  GROUP BY month,side ORDER BY month,side'''
  print('QUERY',k,flush=True)
  try:
   rows=query(q);fn.write_text(json.dumps(rows));print('DONE',k,len(rows),flush=True)
  except Exception as e:print('ERROR',k,e,flush=True);raise
 print('ALL PATTERNS DONE',flush=True)

if __name__=='__main__':run()
