"""Concentration ("centers of gravity") block for summary.json. Stdlib only.
Weights: posts = row count, points = score (known only), comments = descendants (known only)."""
import math,re
STOP=set("""a about above after again all also am an and any are aren't as at be because been before being below between both but by can can't cannot could did do does doing don't down during each few for from further had has have having he her here hers him his how i if in into is isn't it it's its just me more most my no nor not now of off on once only or other our out over own same she should so some such than that the their them then there these they this those through to too under until up us very was we were what when where which while who whom why will with would you your
s t vs via new using use get got one two not-yet hn ask show tell""".split())
WORD=re.compile(r"[a-z][a-z0-9'+#]{2,}")

def gini(vals):
 v=sorted(vals); n=len(v); s=sum(v)
 if n==0 or s==0: return 0.0
 return round((2*sum((i+1)*x for i,x in enumerate(v)))/(n*s)-(n+1)/n,6)

def lorenz(vals,points=80):
 """Concentration curve: entities ranked DESC; x = cumulative share of entities, y = cumulative share of weight.
 x log-spaced from 1e-6 to 1 (first point is the single largest entity)."""
 v=sorted(vals,reverse=True); n=len(v); s=sum(v)
 if n==0 or s==0: return []
 cum=[];c=0
 for x in v: c+=x; cum.append(c)
 ks=sorted({min(n,max(1,math.ceil(10**(-6+6*i/(points-1))*n))) for i in range(points)}|{n})
 return [[round(k/n,8),round(cum[k-1]/s,6)] for k in ks]

def top_share(vals,fracs=(0.001,0.01,0.1)):
 v=sorted(vals,reverse=True); n=len(v); s=sum(v)
 out={}
 for f in fracs:
  k=max(1,math.ceil(f*n)); out[str(f)]=round(sum(v[:k])/s,6) if s else 0.0
 return out

def entity_block(agg):
 """agg: name -> [posts, points, comments]"""
 rows=list(agg.items())
 pts=[r[1][1] for r in rows]; pos=[r[1][0] for r in rows]
 top=sorted(rows,key=lambda r:(-r[1][1],-r[1][0],r[0]))[:50]
 return {'count':len(rows),'gini_points':gini(pts),'gini_posts':gini(pos),
  'lorenz_points':lorenz(pts),'lorenz_posts':lorenz(pos),
  'top':[{'name':k,'posts':v[0],'points':v[1],'comments':v[2]} for k,v in top]}

def compute(db):
 """db: sqlite3 connection with items(id,type,author,time,title,url,domain,score,comments,...)."""
 tot=db.execute('SELECT count(*),coalesce(sum(score),0),coalesce(sum(comments),0) FROM items').fetchone()
 out={'basis':{'points':'sum of score where score is known (comments have no score)','comments':'sum of descendants where known (stories/polls only)',
   'posts':'all items counted, comments included','time':'UTC','word':'lowercased title tokens (3+ chars), stopwords removed, counted once per post'},
  'totals':dict(zip(['posts','points','comments'],tot))}
 ent={}
 for key,col,extra in(('author','author',"author IS NOT NULL AND author<>''"),('domain','domain',"domain IS NOT NULL AND domain<>''")):
  agg={r[0]:list(r[1:]) for r in db.execute(f"SELECT {col},count(*),coalesce(sum(score),0),coalesce(sum(comments),0) FROM items WHERE {extra} GROUP BY {col}")}
  ent[key]=entity_block(agg)
 w={}
 for title,score,com in db.execute("SELECT title,score,comments FROM items WHERE title IS NOT NULL AND title<>''"):
  for t in set(WORD.findall(title.lower()))-STOP:
   a=w.setdefault(t,[0,0,0]); a[0]+=1; a[1]+=score or 0; a[2]+=com or 0
 ent['word']=entity_block(w)
 out['entities']=ent
 sc=[r[0] for r in db.execute('SELECT score FROM items WHERE score IS NOT NULL')]
 cm=[r[0] for r in db.execute('SELECT comments FROM items WHERE comments IS NOT NULL')]
 hist={}
 for s in sc:
  b=-1 if s<=0 else s.bit_length()-1
  h=hist.setdefault(b,[0,0]); h[0]+=1; h[1]+=max(s,0)
 out['posts']={'scored_posts':len(sc),'commented_posts':len(cm),
  'lorenz_points':lorenz(sc),'lorenz_comments':lorenz(cm),
  'top_share_points':top_share(sc),'top_share_comments':top_share(cm),
  'zero_score_share':round(sum(1 for s in sc if s<=0)/len(sc),6) if sc else None,
  'zero_comment_share':round(sum(1 for c in cm if c<=0)/len(cm),6) if cm else None,
  'score_hist':[{'lo':0 if b<0 else 2**b,'hi':0 if b<0 else 2**(b+1)-1,'posts':v[0],'points':v[1]} for b,v in sorted(hist.items())]}
 z=lambda: {'posts':0,'points':0,'comments':0}
 hour=[z() for _ in range(24)]; wd=[z() for _ in range(7)]; mon=[z() for _ in range(12)]; hw=[[0]*24 for _ in range(7)]
 for h,d,m,n,p,c in db.execute("SELECT CAST(strftime('%H',time,'unixepoch') AS INT),CAST(strftime('%w',time,'unixepoch') AS INT),CAST(strftime('%m',time,'unixepoch') AS INT),count(*),coalesce(sum(score),0),coalesce(sum(comments),0) FROM items WHERE time IS NOT NULL GROUP BY 1,2,3"):
  d=(d+6)%7; m-=1
  for t in(hour[h],wd[d],mon[m]): t['posts']+=n; t['points']+=p; t['comments']+=c
  hw[d][h]+=p
 out['cyclic']={'hour':hour,'weekday':wd,'hourweek':hw,'month':mon}
 out['type']={t:{'posts':n,'points':p,'comments':c} for t,n,p,c in db.execute("SELECT type,count(*),coalesce(sum(score),0),coalesce(sum(comments),0) FROM items GROUP BY type ORDER BY count(*) DESC")}
 return out
