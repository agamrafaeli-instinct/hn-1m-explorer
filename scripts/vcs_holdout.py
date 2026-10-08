#!/usr/bin/env python3
"""Six data-discovered themes, earlier discovery/later checks. See docs/vcs-discovery-plan.md."""
import json,re,collections,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
THEMES={
'datacenters':('Data centers and grid',r'\b(?:data cent(?:er|re)s?|power grid|power plants?|nuclear|small modular reactors?)\b',None),
'gpu':('GPU and chip hardware',r'\b(?:gpus?|nvidia|computer chips?|microchips?|chipsets?|chip architectures|chip design|semiconductors?|blackwell|risc-v|cuda)\b',None),
'neurobio':('Neural biology',r'\b(?:organoids?|brain cells?|brain activity|brain surgery|brain scans?|neurons?|neuroscience|eeg|neural implants?)\b',None),
'aerospace':('Aerospace',r'\b(?:aerospace|spaceflight|spacecraft|spacex|rockets?|satellites?|orbit|orbital|nasa|lunar|astronauts?|telescopes?)\b',None),
'solar':('Solar energy',r'\bsolar\b',r'\b(?:eclipse|solar system|solar cycle|solar realms|solar wind|solar storms?|solar flares?|solar sail)\b'),
'robotics':('Physical robotics',r'\b(?:robots?|robotics|humanoids?|autonomous driving|self-driving|boston dynamics)\b',r'\b(?:ads|installs|captcha|robots\.txt|crawler|crawl|search engine|bot traffic)\b')}

def main():
 cache=ROOT/'data/vcs_discovery_rows.json'
 if not cache.exists():
  import subprocess,sys
  subprocess.run([sys.executable,str(ROOT/'scripts/vcs_discover.py'),'--prepare-only'],check=True)
 rows=json.loads(cache.read_text());weeks=sorted({r['week'] for r in rows});train=weeks[:5];test=weeks[5:]
 for r in rows:r['hit']=[k for k,(_,rx,exclude) in THEMES.items() if re.search(rx,r['title'],re.I) and not(exclude and re.search(exclude,r['title'],re.I))]
 union=[r for r in rows if r['hit']];later=[r for r in union if r['week'] in test];ranked=sorted(later,key=lambda r:(-r['points'],r['id']));drop={r['id'] for r in ranked[:math.ceil(len(later)*.01)]}
 domains=collections.Counter();counts=collections.Counter()
 for r in later:
  if r['domain']:domains[r['domain']]+=r['points'];counts[r['domain']]+=1
 top5={d for d,_ in domains.most_common(5)};weekly={w:dict(week=w,total_stories=0) for w in weeks}
 def add(w,key,r):
  for f in ['points','comments','stories']:w[key+'_'+f]=w.get(key+'_'+f,0)+(1 if f=='stories' else r[f])
 for r in rows:
  w=weekly[r['week']];w['total_stories']+=1
  for k in THEMES:add(w,k if k in r['hit'] else k+'_rest',r)
  add(w,'union' if r['hit'] else 'union_rest',r)
  if r['hit'] and r['id'] not in drop:add(w,'trimmed',r)
  if r['hit']:add(w,'inside5' if r['domain'] in top5 else 'outside5',r)
 for w in weekly.values():
  for k in list(THEMES)+[k+'_rest' for k in THEMES]+['union','union_rest','trimmed','inside5','outside5']:
   for f in ['points','comments','stories']:w.setdefault(k+'_'+f,0)
 meta={'manifest_sha256':__import__('hashlib').sha256((ROOT/'data/manifest.json').read_bytes()).hexdigest(),'source_provenance':json.loads((ROOT/'data/manifest.json').read_text())['source'],'method':'Human-assisted discovery from earlier-half TF-IDF NMF topics; frozen regex applied to later half.','discovery_weeks':train,'test_weeks':test,'definitions':THEMES,'counts':{k:{'discovery':sum(r[k+'_stories'] for r in weekly.values() if r['week'] in train),'test':sum(r[k+'_stories'] for r in weekly.values() if r['week'] in test)} for k in THEMES},'later_top_domains':[{'domain':d,'points':v,'stories':counts[d]} for d,v in domains.most_common(25)],'top_hit_removal':{'stories':len(drop),'points':sum(r['points'] for r in ranked if r['id'] in drop),'basket_points':sum(r['points'] for r in later)},'discovery_examples':{k:[{x:r[x] for x in ['id','title','domain','points','url']} for r in sorted([r for r in union if k in r['hit'] and r['week'] in train],key=lambda r:-r['points'])[:8]] for k in THEMES},'source':'data/manifest.json current snapshot; scripts/vcs_discover.py prepares eligible rows'}
 (ROOT/'data/vcs_deeper.json').write_text(json.dumps({'weekly':list(weekly.values()),'provenance':meta},indent=2)+'\n')
 print(json.dumps(meta['counts'],indent=2))
 for p in (ROOT/'hypotheses').glob('h1??-*.json'):p.unlink()
 cave=['Data-led human-assisted topic discovery in first five weeks; tests run on the next five. Topic selection was exploratory. Definitions frozen before later-window computations in docs/vcs-discovery-plan.md.','HN attention is not technical validation, adoption, revenues, readership, investment return or an early-company recommendation.','Small samples, noisy title matching, overlapping topics and duplicate submissions. Means are hit-sensitive; confidence labels are declared thresholds, not statistical intervals.','Current snapshot scores/comments; complete UTC weeks; dead/deleted excluded, missing scores/comments treated as zero.']
 def card(id,key,title,claim,expect,a,b,per_a,per_b,ia,ib,thresholds,unit):
  st,wk,rf=thresholds;check=dict(source='data/vcs_deeper.json',path='weekly',label_field='week',stat='mean_ratio_a_over_b',unit='x',field=a,per_label=unit,group_a=dict(label=title.split(':')[0],field=a,indices=ia),group_b=dict(label='Earlier share' if a==b else ('Leading five domains' if b=='inside5_points' else 'Other stories'),field=b,indices=ib))
  if unit=='share of stories':check['display_pct']=True
  if per_a:check['group_a']['per']=per_a
  if per_b:check['group_b']['per']=per_b
  c=dict(schema=1,id=id,title=title,author='agam-instinct',audience='deep-tech investors',hypothesis=claim,expect=expect,check=check,verdicts=[dict(when=dict(op='>=',value=st),verdict='supported',confidence='strong'),dict(when=dict(op='>=',value=wk),verdict='supported',confidence='weak'),dict(when=dict(op='<=',value=rf),verdict='refuted',confidence='strong'),dict(**{'else':True},verdict='inconclusive',confidence='inconclusive')],caveats=cave.copy())
  (ROOT/f'hypotheses/{id}-{key}.json').write_text(json.dumps(c,indent=2)+'\n')
 for i,(k,(name,_,_)) in enumerate(THEMES.items()):
  n=meta['counts'][k]
  if min(n.values())<20:print('INSUFFICIENT',k,n);continue
  card(f'h{100+2*i}',k+'-persists',name+': attention persists',name+' retains at least 80% of its earlier share of HN stories in the later five weeks.','Later/earlier mean weekly story share: at least 1.5x strongly supports growth, at least 0.8x weakly supports persistence; at or below 0.5x refutes. Between is inconclusive.',k+'_stories',k+'_stories','total_stories','total_stories',list(range(5,10)),list(range(5)),(1.5,.8,.5),'share of stories')
  card(f'h{101+2*i}',k+'-premium',name+': points premium',name+' stories earn more points per story than other stories in the later five weeks.','Mean later weekly points/story ratio: at least 1.3x strongly supports, at least 1.1x weakly supports, at or below 0.9x refutes; between is inconclusive.',k+'_points',k+'_rest_points',k+'_stories',k+'_rest_stories',list(range(5,10)),list(range(5,10)),(1.3,1.1,.9),'points per story')
 card('h112','union-discussion','Discovered themes: discussion premium','The discovered physical/bio themes draw more discussion per story in the later five weeks.','At least 1.3x strong, at least 1.1x weak; at or below 0.9x refuted; between inconclusive.','union_comments','union_rest_comments','union_stories','union_rest_stories',list(range(5,10)),list(range(5,10)),(1.3,1.1,.9),'comments per story')
 card('h113','trimmed-premium','Discovered themes: premium survives hits','The discovered-theme basket keeps a points premium after removing its top-scoring 1% of later stories.','At least 1.3x strong, at least 1.1x weak; at or below 0.9x refuted; between inconclusive.','trimmed_points','union_rest_points','trimmed_stories','union_rest_stories',list(range(5,10)),list(range(5,10)),(1.3,1.1,.9),'points per story')
 card('h114','domain-breadth','Discovered themes: domain breadth','At least half of later discovered-theme points come from outside the five highest-point source domains.','Outside/inside five-domain points: at least 1.5x strong; at least 1x weak; at or below 0.667x refuted; between inconclusive.','outside5_points','inside5_points',None,None,list(range(5,10)),list(range(5,10)),(1.5,1,2/3),'points per week')
 for id,extra in [('h113','Top 1% removed globally within later basket, ceil rounding, ranked points then ID; other stories unchanged.'),('h114','Leading five domains chosen using the later window itself; descriptive, not held-out validation of which hosts will lead. Blank hosts count outside. Domains are sources, not necessarily companies to meet.')]:
  p=next((ROOT/'hypotheses').glob(id+'-*.json'));c=json.loads(p.read_text());c['caveats'].append(extra);p.write_text(json.dumps(c,indent=2)+'\n')
if __name__=='__main__':main()
