
import * as duckdb from '@duckdb/duckdb-wasm';
const q=new URLSearchParams(location.search),mode=q.get('mode')||'a',o=document.getElementById('o');
const base=location.href.replace(/[^/]*$/,''),P=base+'test50.parquet',R={mode,steps:[]};
const mark=l=>fetch(base+'__mark/'+l).catch(()=>{});
const worker=new Worker(base+'duckdb-browser-eh.worker.js');
const db=new duckdb.AsyncDuckDB(new duckdb.VoidLogger(),worker);
await db.instantiate(base+'duckdb-eh.wasm');
await db.open(mode==='c'?{filesystem:{allowFullHTTPReads:false,reliableHeadRequests:true,forceFullHTTPReads:false}}:{});
if(mode==='b')await db.registerFileURL('t.parquet',P,duckdb.DuckDBDataProtocol.HTTP,false);else await db.registerFileURL('t.parquet',P,duckdb.DuckDBDataProtocol.HTTP,true);
const c=await db.connect();
const Q={count:"select count(*) n from 't.parquet'",col:"select count(*) n from 't.parquet' where score>100",search:"select id,title,score from 't.parquet' where type=1 and title ilike '%rust%' order by score desc nulls last limit 25"};
for(const [k,s] of Object.entries(Q)){await mark('start-'+k);const t=performance.now();try{const r=await c.query(s);R.steps.push({k,ms:Math.round(performance.now()-t),rows:r.numRows})}catch(e){R.steps.push({k,err:String(e).slice(0,200)})}await mark('end-'+k)}
window.RESULT=R;o.textContent=JSON.stringify(R);
