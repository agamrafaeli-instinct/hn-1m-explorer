// Headless Chrome screenshot at 390 px (#244). Usage: node shot390.mjs <url> <out.png> [js to run after load]
import {spawn} from 'node:child_process';import fs from 'node:fs';
const ch=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=9344','--user-data-dir=/tmp/cs'+Date.now(),'about:blank'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,6000));
const tabs=await (await fetch('http://127.0.0.1:9344/json')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pend={};ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend[m.id]){pend[m.id](m.result);delete pend[m.id]}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend[i]=r;ws.send(JSON.stringify({id:i,method,params}))});
await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:Number(process.env.SHOT_WIDTH||390),height:844,deviceScaleFactor:2,mobile:true});
await send('Page.navigate',{url:process.argv[2]});await new Promise(r=>setTimeout(r,4000));
await send('Runtime.evaluate',{expression:(process.argv[4]||'0'),awaitPromise:true});await new Promise(r=>setTimeout(r,800));
const s=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(process.argv[3],Buffer.from(s.data,'base64'));
ch.kill();process.exit(0)
