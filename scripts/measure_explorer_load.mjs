import {spawn} from 'node:child_process';import fs from 'node:fs';import http from 'node:http';import path from 'node:path';import zlib from 'node:zlib';
// Measure actual Explorer CSV loading: default Load or smallest slice. Cold cache, slow 4G, 4x CPU, 390px.
// Usage: node scripts/measure_explorer_load.mjs [default|small] [--site URL|--serve DIR] [--out FILE] [--timeout-seconds 135]
const arg=(key,fallback)=>{const i=process.argv.indexOf('--'+key);return i<0?fallback:process.argv[i+1]};
const mode=process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'default';
const port=9471,prof='/tmp/perf397-'+Date.now(),limit=Number(arg('timeout-seconds',135));
let server=null,site=arg('site','https://agamrafaeli-instinct.github.io/hn-1m-explorer/');
if(arg('serve',null)){
 const dir=path.resolve(arg('serve',null));
 server=http.createServer((q,r)=>{let f=path.resolve(dir,'.'+decodeURIComponent(q.url.split('?')[0]));if(!f.startsWith(dir+path.sep)){r.writeHead(403);return r.end()};if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){r.writeHead(404);return r.end()};const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.csv':'text/csv'};r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream','content-encoding':'gzip'});r.end(zlib.gzipSync(fs.readFileSync(f)))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));site='http://127.0.0.1:'+server.address().port+'/';
}
site=site.replace(/\/?$/,'/');
const ch=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port='+port,'--user-data-dir='+prof,'about:blank'],{stdio:'ignore'});
try{
let tabs;for(let i=0;i<40&&!tabs;i++){await new Promise(r=>setTimeout(r,250));try{tabs=await(await fetch('http://127.0.0.1:'+port+'/json')).json()}catch{}}
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0,bytes=0,reqs=0,csvBytes=0,csvReqs=0;const pend={},urls={};
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend[m.id]){pend[m.id](m.result);delete pend[m.id]};if(m.method==='Network.requestWillBeSent')urls[m.params.requestId]=m.params.request.url;if(m.method==='Network.loadingFinished'){bytes+=m.params.encodedDataLength;reqs++;if((urls[m.params.requestId]||'').includes('.csv')){csvBytes+=m.params.encodedDataLength;csvReqs++}}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend[i]=r;ws.send(JSON.stringify({id:i,method,params}))});
const js=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
await send('Network.enable');await send('Page.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
await send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:204800,uploadThroughput:93750});await send('Emulation.setCPUThrottlingRate',{rate:4});
const nav=Date.now();await send('Page.navigate',{url:site+'index.html#/explore'});
for(let i=0;i<120;i++){await new Promise(r=>setTimeout(r,250));if(await js("document.querySelector('#loadn')?.options.length>0"))break}
const options=await js("[...document.querySelector('#loadn').options].map(o=>({value:o.value,text:o.textContent,selected:o.selected}))"),ready=Date.now()-nav;
if(mode==='small')await js("document.getElementById('loadn').selectedIndex=0");
const start=Date.now();await js("document.getElementById('loadbtn').click()");let complete=false;
for(let i=0;i<Math.ceil(limit*4);i++){await new Promise(r=>setTimeout(r,250));if(await js("typeof busy!=='undefined'&&!busy&&loadedSize>0")){complete=true;break}}
const result={mode,site,profile:{latency_ms:150,download_bytes_per_second:204800,upload_bytes_per_second:93750,cpu_slowdown:4,viewport:'390x844@2x',cache:'cold'},timeout_seconds:limit,ready_ms:ready,load_ms:Date.now()-start,complete,options,bytes,reqs,csvBytes,csvReqs,status:await js("document.getElementById('status').textContent"),files:await js('loadedSize'),posts:await js('D.n'),overflow:await js('document.documentElement.scrollWidth-innerWidth')};console.log(JSON.stringify(result));fs.writeFileSync(arg('out','/tmp/measure397-'+mode+'.json'),JSON.stringify(result,null,2));if(!complete)console.error('WARN: Explorer data load timed out; see complete=false, files, posts and status in the JSON report.');else if(result.load_ms>10000)console.error('WARN: Explorer data load exceeded 10 seconds. Timing is not a deploy gate.');ws.close();
}finally{if(server)server.close();ch.kill();await new Promise(r=>setTimeout(r,500));fs.rmSync(prof,{recursive:true,force:true})}
