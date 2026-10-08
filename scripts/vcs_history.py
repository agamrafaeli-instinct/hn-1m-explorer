#!/usr/bin/env python3
"""Usage: python3 scripts/vcs_history.py INPUT_FOLDER. See docs/vcs-history-plan.md."""
import json,csv,collections,calendar,hashlib,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
 folder=Path(sys.argv[1]);files=['dt_daily.csv','dt_topic_monthly.csv','terms70_daily.csv'];hashes={p:hashlib.sha256((folder/p).read_bytes()).hexdigest() for p in files}
 daily=[r for r in csv.DictReader((folder/'dt_daily.csv').open()) if r['type']=='story'];denoms={r['date']:r for r in csv.DictReader((folder/'terms70_daily.csv').open()) if r['type']=='story'}
 agg=collections.defaultdict(lambda:collections.Counter());dates=collections.defaultdict(set)
 for r in daily:
  date=r['date'];m=date[:7];dates[m].add(date);a=agg[m];d=denoms[date];a['stories']+=int(d['total_items']);a['points']+=int(d['story_points_total'])
  for k in ['data_center','gpu','robotics','solar','solar_eclipse']:a[k+'_stories']+=int(r[k]);a[k+'_points']+=int(r[k+'_pts'])
 months=sorted(agg);complete=[m for m in months[1:-1] if len(dates[m])==calendar.monthrange(int(m[:4]),int(m[5:]))[1]]
 monthly={ (r['month'],r['topic']):r for r in csv.DictReader((folder/'dt_topic_monthly.csv').open())}
 rows=[]
 for m in complete:
  a=dict(agg[m]);a['month']=m;t=monthly[m,'data_center']
  assert int(t['stories'])==a['data_center_stories'] and int(t['points'])==a['data_center_points'],m
  a['trimmed_stories']=a['data_center_stories']-min(10,a['data_center_stories']);a['trimmed_points']=a['data_center_points']-int(t['top10_points']);a['rest_stories']=a['stories']-a['data_center_stories'];a['rest_points']=a['points']-a['data_center_points']
  assert all(a[k]>=0 for k in ['trimmed_points','trimmed_stories','rest_points','rest_stories'])
  rows.append(a)
 assert all(r['trimmed_stories']>0 for r in rows[-6:])
 meta={'coverage':'2022-12-01 to 2026-07-31 UTC, endpoint months conservatively excluded','included_months':complete,'first6':complete[:6],'last6':complete[-6:],'input_sha256':hashes,'semantics':'Case-insensitive whole-word matching on story title plus text; not snapshot title-only proxies. Points are archive capture-time snapshots, not present-day final scores. Denominators are story total_items from same provider archive.','edge_exclusion':'Both endpoint months excluded even though daily dates present; completeness of rows does not establish retrieval completeness.','limitations':['Coverage/collection completeness not independently verified against a live full-history source.','Ratios describe archive attention, not technical validation or adoption.','Matching solar includes eclipse/astronomy; separate solar_eclipse not proven a strict subset, no subtraction.','Removing top10 hits is monthly, not fixed percentile; baseline includes no data-center matches.']}
 (ROOT/'data/vcs_history.json').write_text(json.dumps({'monthly':rows,'provenance':meta},indent=2)+'\n')
 cave=['Full-history archive, Jan 2023-Jun 2026 after conservative endpoint exclusion. First/last six complete-month mean share; denominators from same archive, not independently verified all-HN coverage.','Provider matches case-insensitive whole words in title PLUS text; these are not the same title-only topic proxies used in h100-h114.','Points are archive capture snapshots, not current final scores. Collection-age bias and missing/partial retrieval may affect levels. No adoption, readership, technical validity, mainstream lead or investment-return inference.','Thresholds fixed in docs/vcs-history-plan.md before inspecting these aggregate results. Strong/weak are rule labels, not statistical confidence intervals.']
 for i,k in enumerate(['data_center','gpu','robotics','solar','trimmed']):
  id=f'h{115+i}';is_trim=i==4;is_persist=i==2;name=['Data centers','GPU','Robotics','Solar matches','Data centers without monthly hits'][i]
  a=k+'_points' if is_trim else k+'_stories';b='rest_points' if is_trim else a;pa='trimmed_stories' if is_trim else 'stories';pb='rest_stories' if is_trim else 'stories';strong,weak,ref=(1.3,1.1,.9) if is_trim else (1.5,.8,.5) if is_persist else (1.5,1.1,.9)
  card={'schema':1,'id':id,'author':'agam-instinct','audience':'deep-tech investors','title':name+(': long-run hit robustness' if is_trim else ': long-run persistence' if is_persist else ': long-run share growth'),'hypothesis':name+(' retain a points-per-story premium after removing the top ten data-center stories each month.' if is_trim else ' retain at least 80% of their earlier archive-story share.' if is_persist else ' have a higher share of archive stories in the latest six months than the first six.'),'expect':f'Ratio at least {strong:g}x strongly supports, at least {weak:g}x weakly supports; at or below {ref:g}x refutes. Between is inconclusive.','check':{'source':'data/vcs_history.json','path':'monthly','label_field':'month','stat':'mean_ratio_a_over_b','unit':'x','field':a,'per_label':'points per story' if is_trim else 'share of archive stories','group_a':{'label':'Trimmed data centers' if is_trim else 'Latest six months','field':a,'per':pa,'indices':list(range(len(rows)-6,len(rows)))},'group_b':{'label':'Other stories' if is_trim else 'First six months','field':b,'per':pb,'indices':list(range(len(rows)-6,len(rows))) if is_trim else list(range(6))}},'verdicts':[{'when':{'op':'>=','value':strong},'verdict':'supported','confidence':'strong'},{'when':{'op':'>=','value':weak},'verdict':'supported','confidence':'weak'},{'when':{'op':'<=','value':ref},'verdict':'refuted','confidence':'strong'},{'else':True,'verdict':'inconclusive','confidence':'inconclusive'}],'caveats':cave.copy()}
  if not is_trim:card['check']['display_pct']=True
  if k=='solar':card['caveats'].append('Solar includes astronomy/eclipses and other contexts. solar_eclipse overlap cannot safely be subtracted from separate marginal counts. This is not a clean solar-energy test.')
  if k=='robotics':card['caveats'].append('robot(s) and robotics include nonphysical bots; this is a broad robotics-word proxy, not physical-robot adoption.')
  if k=='data_center':card['caveats'].append('Matches data center or data centre, including plural forms according to provider.')
  if is_trim:card['caveats'].append('Remove top ten per month as ranked by provider, subtract ten from story count. Not top 1%. Last six months only; no month has fewer than eleven matching stories.')
  (ROOT/f'hypotheses/{id}-{k.replace("_","-")}-history.json').write_text(json.dumps(card,indent=2)+'\n')
 print(json.dumps({'included':complete,'first6':meta['first6'],'last6':meta['last6']},indent=2))
if __name__=='__main__':main()
