import duckdb,glob,json
c=duckdb.connect();c.execute("set timezone='UTC'");c.execute('create view s as select * from read_parquet(%s) where title is not null'%json.dumps(glob.glob('/tmp/deep-research/hn-pudding/repo/data/archive/stories-*.parquet')))
patterns={
'datacenter':r'\b(data[ -]?cent(er|re)s?|datacent(er|re)s?|hyperscale)\b',
'opposition':r'\b(moratorium|moratoria|ban|bans|banned|oppose|opposed|opposition|protest|protests|backlash|resistance|nimby|zoning|permit|permits|permitting|water|electricity|power|grid|energy|noise|pollution|environmental|diesel|emissions|community|communities|residents)\b',
'recession':r'\b(recession|recessions|soft landing|hard landing|sahm rule|yield curve|yield-curve|economic downturn|economic contraction)\b',
'recession_ex':r'\b(gingival|gum recession|receding gums|hairline|galaxy|galaxies|glacial|glacier|medical|periodontal)\b',
'shipping':r'\bever given\b.*\b(ship|ships|shipping|suez|canal|vessel|container|grounded|stuck|blocked|unstuck)\b|\b(ship|ships|shipping|suez|canal|vessel|container|grounded|stuck|blocked|unstuck)\b.*\bever given\b|\b(hormuz|suez canal|suez crisis|bab[ -]el[ -]mandeb|panama canal)\b|\bred sea\b.*\b(ship|ships|shipping|cargo|container|tanker|tankers|trade|houthi|houthis)\b|\b(ship|ships|shipping|cargo|container|tanker|tankers|trade|houthi|houthis)\b.*\bred sea\b',
'shipping_ex':r'\b(gnu|linux|library|package|python|rust|javascript|node|npm)\b.*\bsuez\b',
}
expr={
'Data centers, all':"regexp_matches(lower(title),'%s')"%patterns['datacenter'],
'Data-center resource/policy pressure':"regexp_matches(lower(title),'%s') and regexp_matches(lower(title),'%s')"%(patterns['datacenter'],patterns['opposition']),
'Recession concern family, global':"regexp_matches(lower(title),'%s') and not regexp_matches(lower(title),'%s')"%(patterns['recession'],patterns['recession_ex'])+" and not (regexp_matches(lower(title),'\\b(soft landing|hard landing)\\b') and regexp_matches(lower(title),'\\b(spacex|falcon|rocket|rockets|moon|mars|aircraft|airplane)\\b') and not regexp_matches(lower(title),'\\b(recession|economy|economic|fed|inflation)\\b'))",
'Data-center opposition explicit':"regexp_matches(lower(title),'%s') and regexp_matches(lower(title),'\\b(moratorium|moratoria|ban|bans|banned|oppose|opposed|opposing|opposition|protest|protests|backlash|nimby|blocked|blocking|rejected|rejection|deny|denied)\\b')"%patterns['datacenter']+" and not regexp_matches(lower(title),'\\b(chips?|gpus?|exports?|routers?|ips|disk|guru|chinese parts|chinese data center devices|illegal spying|spy|spying|solar farms rejected|home ban)\\b')",
'Shipping chokepoints':"regexp_matches(lower(title),'%s') and not regexp_matches(lower(title),'%s')"%(patterns['shipping'],patterns['shipping_ex'])+" and not regexp_matches(lower(title),'hormuz island|tech sector.s strait of hormuz|other suez canal|first person to swim|free diver')",
}
cols=','.join('count(*) filter(where %s) as t%d'%(e,i) for i,e in enumerate(expr.values()))
cur=c.execute("select strftime(time at time zone 'UTC','%%Y-%%m') as month,count(*) total,%s from s where time < '2026-08-01' group by 1 order by 1"%cols);names=[x[0] for x in cur.description];ms=[dict(zip(names,r)) for r in cur.fetchall()];early=ms[:-12];late=ms[-12:]
def pack(a,k):
 n=sum(x[k] for x in a);total=sum(x['total'] for x in a);return {'start':a[0]['month'],'end':a[-1]['month'],'n':n,'total':total,'pct':100*n/total}
out={}
for i,(label,e) in enumerate(expr.items()):
 k='t%d'%i;a=pack(late,k);b=pack(early,k);w=[pack(early[j:j+12],k) for j in range(len(early)-11) if early[j]['month']>='2007-01'];peak=max(w,key=lambda r:r['pct']);out[label]={'latest':a,'history':b,'peak':peak,'vs_history':a['pct']/b['pct'],'vs_peak':a['pct']/peak['pct'],'expression':e}
json.dump(out,open('/tmp/deep-research/hn-topics/poly-results.json','w'),indent=2);print(json.dumps(out,indent=2))
for label,e in expr.items():
 print('\nSAMPLE',label)
 for (t,) in c.execute("select title from s where (%s) order by hash(id) limit 65"%e).fetchall():print(t)
 print('\nLATEST',label)
 for (t,) in c.execute("select title from s where (%s) and time >= '2025-08-01' and time < '2026-08-01' order by hash(id) limit 40"%e).fetchall():print(t)
