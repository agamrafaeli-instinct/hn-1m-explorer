// Phone sweep (docs/PHONE_CHECKLIST.md items 1, 3, 4): visits every screen at 320, 390 and 430 px and lists
// sideways scroll, tap targets under 44 px and controls or charts with no label. Report only: it exits 0.
// Usage: node scripts/phone_sweep.mjs [--site http://localhost:8766/] [--out /tmp/phone_sweep.json]
import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i<0?d:process.argv[i+1]};
const site=arg('site','http://localhost:8766/'), outFile=arg('out','/tmp/phone_sweep.json');
const port=9340+Math.floor(Math.random()*50);
const ch=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-port='+port,'--user-data-dir=/tmp/ps'+Date.now(),'about:blank'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,3000));
const tabs=await (await fetch('http://127.0.0.1:'+port+'/json')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pend={};ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend[m.id]){pend[m.id](m.result);delete pend[m.id]}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend[i]=r;ws.send(JSON.stringify({id:i,method,params}))});
await send('Page.enable');
const idx=await (await fetch(site+'data/weekly/index.json')).json();const wk=idx.weeks[idx.weeks.length-1].week;
export const SCREENS=['#/','#/a/engineers','#/a/vcs','#/a/geeks','#/c/h370','#/hypotheses','#/w/engineers/'+wk,'#/w/vcs/'+wk,'#/w/geeks/'+wk,'#/s/2026-10-11','#/story','#/explore','#/submit','#/how','#/lesson','#/topics','#/today','#/l/github.com','#/l/n/Nvidia','#/t/llm','#/compare'];
const expr=`(()=>{
const vis=e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
const nm=e=>(e.innerText||e.getAttribute('aria-label')||e.title||e.value||e.getAttribute('aria-labelledby')||'').trim();
const tap=[],unl=[];
for(const e of document.querySelectorAll('a[href],button,input:not([type=hidden]),select,summary,[role=button]')){
 if(!vis(e))continue;const r=e.getBoundingClientRect(),s=getComputedStyle(e);
 if(!nm(e)&&!e.querySelector('img[alt],svg[aria-label]'))unl.push(e.tagName.toLowerCase()+':'+e.outerHTML.slice(0,50).replace(/\\s+/g,' '));
 const inline=s.display==='inline'&&e.tagName==='A';if(inline)continue;
 if(r.width<44||r.height<44)tap.push(e.tagName.toLowerCase()+':'+(nm(e)||'(none)').slice(0,22)+' '+Math.round(r.width)+'x'+Math.round(r.height));}
const svgs=[...document.querySelectorAll('svg')].filter(s=>vis(s)&&s.getBoundingClientRect().width>40&&!s.getAttribute('aria-label')&&!s.getAttribute('aria-hidden')&&!s.querySelector('title')&&!s.closest('[aria-hidden=true],button,a')).length;
return JSON.stringify({scroll:document.documentElement.scrollWidth-innerWidth,tap,unl,svgs});})()`;
const rows=[];
for(const w of [320,390,430]){await send('Emulation.setDeviceMetricsOverride',{width:w,height:800,deviceScaleFactor:1,mobile:true});
 for(const s of SCREENS){await send('Page.navigate',{url:site+s});await new Promise(r=>setTimeout(r,1500));
  const r=await send('Runtime.evaluate',{returnByValue:true,expression:expr});rows.push({w,screen:s,...JSON.parse(r.result.value)});}}
writeFileSync(outFile,JSON.stringify(rows,null,1));
const by={};for(const r of rows)(by[r.screen]=by[r.screen]||[]).push(r);
console.log('screen'.padEnd(26),'sideways(px)'.padEnd(16),'taps<44'.padEnd(14),'no label'.padEnd(12),'chart no name');
let bad=0;
for(const [s,l] of Object.entries(by)){const f=k=>l.map(r=>Array.isArray(r[k])?r[k].length:r[k]).join('/');
 console.log(s.padEnd(26),f('scroll').padEnd(16),f('tap').padEnd(14),f('unl').padEnd(12),f('svgs'));
 for(const r of l){if(r.scroll>0||r.tap.length||r.unl.length||r.svgs)bad++}}
console.log('\n(numbers are for 320/390/430 px)  screens-widths with a finding:',bad,'of',rows.length);
const top={};for(const r of rows)for(const t of r.tap)top[t.replace(/ \d+x\d+$/,'')]=(top[t.replace(/ \d+x\d+$/,'')]||0)+1;
console.log('most common small tap targets:',Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>v+' x '+k).join(' | '));
ch.kill();process.exit(0);
