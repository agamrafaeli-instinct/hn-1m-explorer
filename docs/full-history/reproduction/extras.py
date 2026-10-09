import pathlib,json,sys
sys.path.insert(0,str(pathlib.Path(__file__).parent));from query import query
from aggregate import patterns,hit,BASE,LIVE,OUT,themes
q=f"SELECT month,groupArray(tuple(weekday,hour,posts,points,comments,min_day,max_day)) cells FROM (SELECT formatDateTime(time,'%Y-%m') month,toDayOfWeek(time)-1 weekday,toHour(time) hour,count() posts,sumIf(score,score>=0) points,sumIf(descendants,descendants>=0) comments,min(toDate(time)) min_day,max(toDate(time)) max_day FROM {BASE} GROUP BY month,weekday,hour) GROUP BY month ORDER BY month"
rows=[]
for r in query(q):
 for cell in r['cells']:rows.append(dict(month=r['month'],**dict(zip(['weekday','hour','posts','points','comments','min_day','max_day'],cell))))
(OUT/'cyclic.json').write_text(json.dumps(rows));print('cyclic',len(rows),flush=True)
for k,n in [('geeks_weird',1),('vc_union',5)]:
 h=hit(patterns[k]) if k!='vc_union' else '('+' OR '.join(hit((v[1],v[2])) for v in themes.values())+')'
 extra=" AND domain(url)!=''" if k=='vc_union' else ''
 q=f"SELECT month,arraySlice(arraySort(x->tuple(-x.2,x.1),groupArray(tuple(domain,points,stories,comments))),1,{n}) leading FROM (SELECT formatDateTime(time,'%Y-%m') month,replaceRegexpOne(lower(domain(url)),'^www\\\\.','') domain,count() stories,sumIf(score,score>=0) points,sumIf(descendants,descendants>=0) comments FROM {LIVE} AND {h}{extra} GROUP BY month,domain) GROUP BY month ORDER BY month"
 rows=[]
 for r in query(q):
  for d in r['leading']:rows.append(dict(month=r['month'],**dict(zip(['domain','points','stories','comments'],d))))
 (OUT/(k+'_domains.json')).write_text(json.dumps(rows));print(k,len(rows),flush=True)
