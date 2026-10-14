import {spawn} from 'node:child_process';import fs from 'node:fs';
// Measure actual Explorer CSV loading: default Load or smallest slice. Cold cache, slow 4G, 4x CPU, 390px.
// Usage: node scripts/measure_explorer_load.mjs [default|small]
const mode=process.argv[2]||'default',port=9471,prof='/tmp/perf397-'+Date.now();
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
const nav=Date.now();await send('Page.navigate',{url:'https://agamrafaeli-instinct.github.io/hn-1m-explorer/index.html#/explore'});
for(let i=0;i<120;i++){await new Promise(r=>setTimeout(r,250));if(await js("document.querySelector('#loadn')?.options.length>0"))break}
const options=await js("[...document.querySelector('#loadn').options].map(o=>({value:o.value,text:o.textContent,selected:o.selected}))"),ready=Date.now()-nav;
if(mode==='small')await js("document.getElementById('loadn').selectedIndex=0");
const start=Date.now();await js("document.getElementById('loadbtn').click()");let complete=false;
for(let i=0;i<540;i++){await new Promise(r=>setTimeout(r,250));if(await js("typeof busy!=='undefined'&&!busy&&loadedSize>0")){complete=true;break}}
const result={mode,ready_ms:ready,load_ms:Date.now()-start,complete,options,bytes,reqs,csvBytes,csvReqs,status:await js("document.getElementById('status').textContent"),files:await js('loadedSize'),posts:await js('D.n'),overflow:await js('document.documentElement.scrollWidth-innerWidth')};console.log(JSON.stringify(result));fs.writeFileSync('/tmp/measure397-'+mode+'.json',JSON.stringify(result,null,2));ws.close();
}finally{ch.kill();await new Promise(r=>setTimeout(r,500));fs.rmSync(prof,{recursive:true,force:true})}
