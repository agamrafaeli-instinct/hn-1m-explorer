import {spawn} from 'node:child_process';
const ch=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-port=9337','--user-data-dir=/tmp/cs'+Date.now(),'about:blank'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,2500));
const tabs=await (await fetch('http://127.0.0.1:9337/json')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pend={};ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend[m.id]){pend[m.id](m.result);delete pend[m.id]}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend[i]=r;ws.send(JSON.stringify({id:i,method,params}))});
await send('Page.enable');
const routes=['#/','#/compare','#/a/geeks','#/t/llm','#/c/h369/all','#/hypotheses','#/how','#/s/2026-10-11'];
const expr=`(()=>{
const lum=c=>{const a=c.match(/[\\d.]+/g).map(Number);const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(a[0])+.7152*f(a[1])+.0722*f(a[2])};
const bg=el=>{while(el){const c=getComputedStyle(el).backgroundColor;const a=c.match(/[\\d.]+/g);if(a&&(a.length<4||+a[3]>.9))return c;el=el.parentElement}return 'rgb(255,255,255)'};
let low=[],n=0;
for(const el of document.querySelectorAll('h1,h2,h3,p,li,a,button,span,small,td,th,label')){
 if(!el.childNodes.length||![...el.childNodes].some(x=>x.nodeType==3&&x.textContent.trim()))continue;
 const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;
 const s=getComputedStyle(el);const f=lum(s.color),b=lum(bg(el));const cr=(Math.max(f,b)+.05)/(Math.min(f,b)+.05);
 const big=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&+s.fontWeight>=700);n++;
 if(cr<(big?3:4.5))low.push(el.tagName+':'+el.textContent.trim().slice(0,24)+':'+cr.toFixed(2));}
const unnamed=[...document.querySelectorAll('a,button,input,select')].filter(e=>e.getBoundingClientRect().width&&!(e.innerText||e.getAttribute('aria-label')||e.title||e.value||'').trim()).map(e=>e.outerHTML.slice(0,60));
const svgs=[...document.querySelectorAll('svg')].filter(s=>s.getBoundingClientRect().width>40&&!s.getAttribute('aria-label')&&!s.getAttribute('aria-hidden')&&!s.querySelector('title')).length;
const small=[...document.querySelectorAll('a,button')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&(r.height<24||r.width<24)&&getComputedStyle(e).display!=='inline'}).length;
return JSON.stringify({w:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,lang:document.documentElement.lang,main:!!document.querySelector('main,[role=main]'),checked:n,low:low.slice(0,5),lowN:low.length,unnamed,svgNoName:svgs,smallTargets:small,imgNoAlt:[...document.images].filter(i=>!i.hasAttribute('alt')).length})})()`;
const out=[];
for(const w of [320,390,430]){await send('Emulation.setDeviceMetricsOverride',{width:w,height:800,deviceScaleFactor:1,mobile:true});
for(const rt of routes){await send('Page.navigate',{url:'http://localhost:8766/'+rt});await new Promise(r=>setTimeout(r,2200));
const r=await send('Runtime.evaluate',{returnByValue:true,expression:expr});const v=JSON.parse(r.result.value);out.push({w,route:rt,...v});console.log(w,rt,r.result.value)}}
import('node:fs').then(f=>f.writeFileSync('/tmp/a11y.json',JSON.stringify(out,null,1)));
setTimeout(()=>{ch.kill();process.exit(0)},300)
