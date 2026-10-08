#!/usr/bin/env python3
"""Build deterministic, byte-bounded HN CSV chunks from JSONL / JSONL.gz."""
import argparse, csv, datetime as dt, gzip, hashlib, io, json, pathlib, sqlite3, tempfile
from urllib.parse import urlparse

COLUMNS = [
 ('id','integer',False,'HN item ID'),('type','string',True,'HN item type'),
 ('by','string',True,'Author handle'),('time','integer',True,'Unix timestamp in UTC seconds'),
 ('title','string',True,'Title as returned by source'),('url','string',True,'External URL'),
 ('domain','string',True,'Lowercase URL hostname, leading www. removed'),
 ('score','integer',True,'Score at collection time'),('descendants','integer',True,'Comment count at collection time'),
 ('text','string',True,'Full source HTML text, untrusted; render as text, not HTML'),
 ('dead','boolean',False,'1 if dead, otherwise 0'),('deleted','boolean',False,'1 if deleted, otherwise 0')]
NAMES = [c[0] for c in COLUMNS]

def integer(value):
 if value is None or value == '': return None
 if isinstance(value,bool): raise ValueError('Boolean is not an integer field')
 if isinstance(value,float) and not value.is_integer(): raise ValueError('Noninteger numeric field')
 return int(value)

def normalize(raw):
 # Native Firebase records and Algolia search hits supported without dropping text.
 def first(*keys):
  for k in keys:
   if k in raw and raw[k] is not None: return raw[k]
  return None
 item_id=integer(first('id','objectID'))
 if item_id is None or item_id < 1: raise ValueError('Missing/invalid HN ID')
 stamp=integer(first('time','created_at_i'))
 url=first('url') or ''
 try:
  domain=(urlparse(url).hostname or '').lower()
 except ValueError: domain=''
 if domain.startswith('www.'): domain=domain[4:]
 typ=first('type')
 if not typ:
  tags=raw.get('_tags',[])
  typ=next((x for x in ('story','job','poll','pollopt','comment') if x in tags),'story')
 values=[item_id,typ,first('by','author'),stamp,first('title'),url,domain,
  integer(first('score','points')),integer(first('descendants','num_comments')),
  first('text','story_text','comment_text'),int(bool(raw.get('dead',False))),int(bool(raw.get('deleted',False)))]
 for i in (1,2,4,5,6,9):
  if values[i] is not None and not isinstance(values[i],str): raise ValueError('Expected string: '+NAMES[i])
 return values

def encode(row):
 out=io.StringIO(newline='')
 csv.writer(out,lineterminator='\r\n').writerow(['' if x is None else x for x in row])
 return out.getvalue().encode('utf-8')

def input_rows(path):
 opener=gzip.open if str(path).endswith('.gz') else open
 with opener(path,'rt',encoding='utf-8') as f:
  for number,line in enumerate(f,1):
   if line.strip():
    try: yield normalize(json.loads(line))
    except Exception as e: raise ValueError(f'{path}:{number}: {e}') from e

def build(inputs,output,target,source,expected=None):
 output=pathlib.Path(output); data=output/'data'; data.mkdir(parents=True,exist_ok=True)
 if list(data.glob('posts-*.csv')) or (data/'manifest.json').exists():
  raise ValueError('Output already contains dataset files; use a fresh output folder')
 header=encode(NAMES)
 if target <= len(header): raise ValueError('Chunk target too small')
 with tempfile.TemporaryDirectory() as tmp:
  db=sqlite3.connect(str(pathlib.Path(tmp)/'items.sqlite'))
  db.execute('PRAGMA journal_mode=OFF'); db.execute('PRAGMA synchronous=OFF')
  db.execute('CREATE TABLE items (id INTEGER PRIMARY KEY, type TEXT, author TEXT, time INTEGER, title TEXT, url TEXT, domain TEXT, score INTEGER, comments INTEGER, text TEXT, dead INTEGER, deleted INTEGER)')
  n=0
  for path in inputs:
   for row in input_rows(path):
    # Reject duplicate IDs instead of silently changing the requested count.
    try: db.execute('INSERT INTO items VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',row)
    except sqlite3.IntegrityError as e: raise ValueError(f'Duplicate ID {row[0]}') from e
    n+=1
    if n%10000==0: db.commit()
  db.commit()
  if expected is not None and n!=expected: raise ValueError(f'Expected {expected:,} unique rows, found {n:,}')
  if not n: raise ValueError('Empty dataset')
  db.execute('CREATE INDEX chronology ON items(time DESC,id DESC)')
  chunks=[]; handle=None; meta=None; digest=None
  def finish():
   if handle:
    handle.close(); meta['sha256']=digest.hexdigest(); chunks.append(meta.copy())
  for row in db.execute('SELECT * FROM items ORDER BY time DESC,id DESC'):
   payload=encode(row)
   if len(header)+len(payload)>target: raise ValueError(f'Row {row[0]} exceeds chunk target; no truncation performed')
   if handle is None or meta['bytes']+len(payload)>target:
    finish()
    filename=f'posts-{len(chunks)+1:05d}.csv'
    handle=open(data/filename,'wb'); handle.write(header)
    digest=hashlib.sha256(); digest.update(header)
    meta={'path':'data/'+filename,'rows':0,'bytes':len(header),'min_id':row[0],'max_id':row[0],'min_time':row[3],'max_time':row[3]}
   handle.write(payload); digest.update(payload); meta['rows']+=1; meta['bytes']+=len(payload)
   meta['min_id']=min(meta['min_id'],row[0]); meta['max_id']=max(meta['max_id'],row[0])
   if row[3] is not None:
    meta['min_time']=row[3] if meta['min_time'] is None else min(meta['min_time'],row[3])
    meta['max_time']=row[3] if meta['max_time'] is None else max(meta['max_time'],row[3])
  finish()
  stamp=dt.datetime.now(dt.timezone.utc).isoformat()
  totals=db.execute('SELECT count(*),coalesce(sum(score),0),coalesce(sum(comments),0),sum(dead),sum(deleted),sum(time IS NULL),sum(score IS NULL),sum(comments IS NULL) FROM items').fetchone()
  summary={'schema_version':1,'generated_at':stamp,'total_rows':n,
   'totals':dict(zip(['posts','score_sum','comments_sum','dead','deleted','missing_time','missing_score','missing_comments'],totals)),
   'time_range':dict(zip(['min','max'],db.execute('SELECT min(time),max(time) FROM items').fetchone())),
   'type_counts':dict(db.execute('SELECT type,count(*) FROM items GROUP BY type ORDER BY count(*) DESC,type')),
   'monthly':[dict(zip(['month','posts','score_sum','comments_sum'],r)) for r in db.execute("SELECT strftime('%Y-%m',time,'unixepoch'),count(*),coalesce(sum(score),0),coalesce(sum(comments),0) FROM items WHERE time IS NOT NULL GROUP BY 1 ORDER BY 1")],
   'top_domains':[dict(zip(['domain','posts'],r)) for r in db.execute("SELECT domain,count(*) FROM items WHERE domain IS NOT NULL AND domain<>'' GROUP BY domain ORDER BY count(*) DESC,domain LIMIT 100")],
   'top_authors':[dict(zip(['by','posts'],r)) for r in db.execute("SELECT author,count(*) FROM items WHERE author IS NOT NULL AND author<>'' GROUP BY author ORDER BY count(*) DESC,author LIMIT 100")],
   'top_posts':[{k:v for k,v in zip(NAMES,r) if k!='text'} for r in db.execute('SELECT * FROM items ORDER BY score DESC, time DESC, id DESC LIMIT 100')]}
  try: from concentration import compute as _conc
  except ImportError: from scripts.concentration import compute as _conc
  summary['concentration']=_conc(db)
  (data/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  manifest={'schema_version':1,'generated_at':stamp,'total_rows':n,'columns':[dict(zip(['name','type','nullable','description'],r)) for r in COLUMNS],
   'order':'time DESC, id DESC; missing time last','chunk_target_bytes':target,'csv':{'encoding':'UTF-8','delimiter':',','quote':'"','line_ending':'CRLF','header':True,'null':'','boolean_values':[0,1]},
   'chunks':chunks,'summary_path':'data/summary.json','source':source,'total_csv_bytes':sum(c['bytes'] for c in chunks)}
  total=sum(p.stat().st_size for p in data.iterdir())
  if total>900_000_000: raise ValueError(f'Dataset {total:,} bytes approaches Pages 1 GB cap; choose archive/site split')
  (data/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  return manifest

def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('inputs',nargs='+',type=pathlib.Path); p.add_argument('--output',required=True)
 p.add_argument('--chunk-bytes',type=int,default=8*1024*1024); p.add_argument('--expected-rows',type=int)
 p.add_argument('--source-json',required=True,type=pathlib.Path)
 a=p.parse_args(); m=build(a.inputs,a.output,a.chunk_bytes,json.loads(a.source_json.read_text()),a.expected_rows)
 print(json.dumps({k:m[k] for k in ('total_rows','total_csv_bytes','chunk_target_bytes')},indent=2)); print('Chunks:',len(m['chunks']))
if __name__=='__main__': main()
