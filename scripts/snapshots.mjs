// Screenshots of the key screens at 390 px (#247). Usage: node scripts/snapshots.mjs --site http://localhost:8766/ --out /tmp/snap
// Full page height, capped at 3000 px so a long page stays small. Names match SCREENS below.
import {spawn} from 'node:child_process';
import {writeFileSync, mkdirSync} from 'node:fs';
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i<0?d:process.argv[i+1]};
const site=arg('site','http://localhost:8766/'), out=arg('out','/tmp/snap');
export const SCREENS={home:'#/',compare:'#/compare',week:'#/w/engineers/2026-W31',card:'#/c/h370',explorer:'#/explore',rings:'#/rings'};
mkdirSync(out,{recursive:true});
const port=9400+Math.floor(Math.random()*50);
const ch=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars','--force-color-profile=srgb','--remote-debugging-port='+port,'--user-data-dir=/tmp/sn'+Date.now(),'about:blank'],{stdio:'ignore'});
let tabs;for(let i=0;i<40&&!tabs;i++){await new Promise(r=>setTimeout(r,1000));try{tabs=await (await fetch('http://127.0.0.1:'+port+'/json')).json()}catch{}}
if(!tabs){console.error('chrome debug port never opened');process.exit(2)}
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pend={};ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend[m.id]){pend[m.id](m.result);delete pend[m.id]}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend[i]=r;ws.send(JSON.stringify({id:i,method,params}))});
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
for(const [name,route] of Object.entries(SCREENS)){
  await send('Page.navigate',{url:site+'index.html'+route});await new Promise(r=>setTimeout(r,4500));
  await send('Runtime.evaluate',{expression:"document.querySelectorAll('*').forEach(e=>{e.style.animation='none';e.style.transition='none'});0"});
  const h=await send('Runtime.evaluate',{returnByValue:true,expression:'Math.min(3000,Math.ceil(document.documentElement.scrollHeight))'});
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:h.result.value,deviceScaleFactor:1,mobile:true});
  await new Promise(r=>setTimeout(r,600));
  const s=await send('Page.captureScreenshot',{format:'png'});writeFileSync(out+'/'+name+'.png',Buffer.from(s.data,'base64'));
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  console.log('shot',name);
}
ch.kill();process.exit(0)
