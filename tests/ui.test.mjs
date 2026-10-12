#!/usr/bin/env node
// UI check on a phone-sized screen (390px) against a staged site. Any console error, failed request or sideways overflow fails the run.
// usage: node tests/ui.test.mjs [--serve DIR | --site URL]   (default: stage the repo to a temp folder and serve it)
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import zlib from 'node:zlib';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const root = path.resolve(new URL('..', import.meta.url).pathname);
let dir = arg('serve', null), SITE = arg('site', null), tmp = null, server = null;
if (!SITE) {
  if (!dir) { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-')); dir = path.join(tmp, 'site'); execFileSync('python3', [path.join(root, 'scripts/stage_site.py'), '--output', dir], { cwd: root, stdio: 'ignore' }); }
  dir = path.resolve(dir);
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.csv': 'text/csv', '.svg': 'image/svg+xml' };
  server = http.createServer((q, r) => {
    let f = path.join(dir, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(dir)) { r.writeHead(403); return r.end(); }
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); }
    const ext = path.extname(f), body = fs.readFileSync(f), h = { 'content-type': types[ext] || 'application/octet-stream' };
    if (types[ext] && /gzip/.test(q.headers['accept-encoding'] || '')) { h['content-encoding'] = 'gzip'; r.writeHead(200, h); return r.end(zlib.gzipSync(body)); }
    r.writeHead(200, h); r.end(body);
  });
  await new Promise(ok => server.listen(0, '127.0.0.1', ok)); SITE = `http://127.0.0.1:${server.address().port}/`;
}
SITE = SITE.replace(/\/?$/, '/');
let port, prof, ch, tabs;
for (let attempt = 0; attempt < 3 && !tabs; attempt++) {
  port = 9800 + Math.floor(Math.random() * 150); prof = fs.mkdtempSync(path.join(os.tmpdir(), 'uic-'));
  ch = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--remote-debugging-port=' + port, '--user-data-dir=' + prof, 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 80 && !tabs; i++) { await new Promise(r => setTimeout(r, 250)); try { const t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (Array.isArray(t) && t.some(x => x.type === 'page')) tabs = t; } catch { } }
  if (!tabs) { try { ch.kill(); } catch { } }
}
if (!tabs) { console.error('Chrome devtools did not start after 3 tries'); process.exit(1); }
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = {}, problems = [], urls = {};
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pend[m.id]) { pend[m.id](m.result); delete pend[m.id]; return; }
  const p = m.params || {};
  if (m.method === 'Runtime.exceptionThrown') problems.push('exception: ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text).slice(0, 160));
  if (m.method === 'Runtime.consoleAPICalled' && p.type === 'error') problems.push('console.error: ' + p.args.map(a => a.value ?? a.description).join(' ').slice(0, 160));
  if (m.method === 'Network.requestWillBeSent') urls[p.requestId] = p.request.url;
  if (m.method === 'Network.loadingFailed' && !p.canceled) problems.push('failed request: ' + (urls[p.requestId] || '?') + ' ' + p.errorText);
  if (m.method === 'Network.responseReceived' && p.response.status >= 400 && !/favicon/.test(p.response.url)) problems.push('HTTP ' + p.response.status + ': ' + p.response.url);
};
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value;
const wait = async (expr, ms = 20000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await ev(expr)) return true; await new Promise(r => setTimeout(r, 50)); } return false; };
await send('Network.enable'); await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
const results = [];
async function check(name, route, ready, extra) {
  const before = problems.length, t0 = Date.now(); let why = '';
  await send('Page.navigate', { url: SITE + 'index.html' + route });
  const ok = await wait(ready);
  if (!ok) why = 'content never appeared';
  else if (extra) { try { why = (await extra()) || ''; } catch (e) { why = 'error: ' + e.message; } }
  await new Promise(r => setTimeout(r, 300));
  const ov = await ev('document.documentElement.scrollWidth-innerWidth'); if (ov > 0) why += (why ? '; ' : '') + `sideways overflow ${ov}px`;
  const errs = problems.slice(before); if (errs.length) why += (why ? '; ' : '') + errs.join(' | ');
  results.push({ name, ok: !why, why }); console.log((why ? 'FAIL ' : 'ok   ') + name.padEnd(22) + (Date.now() - t0) + ' ms' + (why ? '  ' + why : ''));
}
const q1 = s => `(()=>{const e=document.querySelector(${JSON.stringify(s)});return !!e&&e.textContent.trim().length>0})()`;
await check('saga', '#/', q1('.sg_hook h1'));
await check('home', '#/compare', q1('#homeweek_s'), async () => (await ev(q1('#homeweek')) ? '' : 'no latest-week link'));
await check('card', '#/c/h300/engineers', q1('#aud_card article.hyp'), async () => ((await ev("document.querySelectorAll('#aud_card article.hyp').length")) === 1 ? '' : 'expected exactly one card'));
await check('card_story_format', '#/c/h380/engineers', q1('#aud_card article.hyp'), async () => {
  await ev("HypCards.one('h380').then(x=>{window.__x=x.r})"); await wait('!!window.__x', 8000);
  const bad = await ev(`(()=>{const r=window.__x,t=document.querySelector('#aud_card .take'),m=[r.mean_a,r.mean_b].map(v=>v>=10?v.toFixed(1):v.toFixed(2));let w=[];if(document.querySelector('#aud_card .verdict'))w.push('verdict stamp shown');if(/Tested proposition/i.test(document.getElementById('aud_card').textContent))w.push('tested proposition text');if(!t)w.push('no answer sentence');else m.forEach(x=>{if(t.textContent.indexOf(x)<0)w.push('answer lacks '+x)});if(!document.querySelector('#aud_card svg .ln-a'))w.push('no line label');return w.join('; ')})()`);
  return bad;
});
await check('saga_search_door', '#/', q1('#sg_find'), async () => { await ev("document.getElementById('sg_q').value='rust';document.getElementById('sg_find').requestSubmit()"); await new Promise(r => setTimeout(r, 600)); return (await ev('location.hash')) === '#/explore?q=rust' ? '' : 'search box did not open the explorer'; });
await check('card_list_has_cards', '#/hypotheses', q1('#hyp_list article.hyp'), async () => ((await ev("document.querySelectorAll('#hyp_list article').length")) >= 20 ? '' : 'card list is empty'));
await check('old_audience_link_redirects', '#/a/engineers', q1('#hyp_tally'), async () => ((await ev('location.hash')) === '#/hypotheses' ? '' : 'did not redirect to the card list'));
await check('list_no_stamp', '#/hypotheses', q1('#hyp_tally'), async () => ((await ev("/\\b(supported|refuted|inconclusive)\\b/i.test(document.getElementById('v_hyp').textContent)")) ? 'verdict word on the list page' : ''));
const AUDN = { engineers: 'Engineers', vcs: 'Deep-tech VCs', geeks: 'Curious geeks' };
for (const a of ['engineers', 'vcs', 'geeks']) await check('week_' + a, '#/w/' + a, q1('#w_body .wsec'), async () => {
  const t = await ev('document.title'), d = await ev("document.querySelector('meta[name=description]').content");
  if (!t.startsWith(AUDN[a] + ': week ')) return 'page title is ' + t;
  if (!/\d{4}-W\d{2}/.test(t)) return 'title has no week';
  const f = await ev("(document.querySelector('#w_body .wfoot')||{}).textContent||''");
  if (!/Word lists: version \d+/.test(f)) return 'footer has no list version';
  if (!d.includes(AUDN[a]) || d.length < 40) return 'description is ' + d;
  return '';
});
await check('week to explorer links', '#/w/engineers', q1('#w_body .wsec'), async () => {
  const v = await ev("JSON.stringify([...document.querySelectorAll('#w_body .wf a.wexp')].slice(0,3).map(a=>a.getAttribute('href')))");
  const l = JSON.parse(v || '[]');
  return l.length && l.every(h => /^#\/explore\?week=\d{4}-W\d{2}&q=.+/.test(h)) ? '' : 'flagged items do not link to the explorer: ' + v;
});
// One list item per saved week, so the count follows data/weekly/index.json instead of a fixed number.
const weeksSaved = async () => Number((await send('Runtime.evaluate', { expression: "fetch('data/weekly/index.json').then(r => r.json()).then(j => j.weeks.length)", awaitPromise: true, returnByValue: true })).result.value);
await check('lens page', '#/l/github.com', q1('#lens_body .lens_h'), async () => {
  const v = await ev("JSON.stringify([document.querySelector('#lens_body .lens_h')?.textContent, document.querySelectorAll('#lens_body .lens_wk li').length, !!document.querySelector('#lens_body svg[aria-label]')])");
  const n = await weeksSaved();
  return v === JSON.stringify(['github.com', n, true]) ? '' : 'lens page not as expected: ' + v;
});
await check('lens name page', '#/l/n/Nvidia', q1('#lens_body .lens_h'), async () => {
  const v = await ev("JSON.stringify([document.querySelector('#lens_body .lens_h')?.textContent, document.querySelectorAll('#lens_body .lens_wk li').length])");
  const n = await weeksSaved();
  return v === JSON.stringify(['Nvidia', n]) ? '' : 'lens name page not as expected: ' + v;
});
await check('lens bad address', '#/l/bad!id', q1('#lens_body'), async () => {
  if (!await wait("/No page for this one/.test(document.getElementById('lens_body').textContent)", 5000)) return 'a missing lens page did not say so';
  return '';
});
await check('week to lens links', '#/w/engineers', q1('#w_body .wsec'), async () => {
  const v = await ev("JSON.stringify([...document.querySelectorAll('#w_body .wf a.wlens')].map(a=>a.getAttribute('href')))");
  const l = JSON.parse(v || '[]');
  const none = await ev("[...document.querySelectorAll('#w_body .wf')].some(li=>!li.querySelector('a.wlens'))");
  return l.length && l.every(h => /^#\/l\/.+/.test(h)) && none ? '' : 'lens links missing or on every row: ' + v + ' ' + none;
});
await check('stepper', '#/w/engineers', q1('#w_body .wsec'), async () => {
  const wk = () => ev("location.hash"), t1 = () => ev("document.querySelector('#w_body .wmid b')?.textContent||''");
  const h0 = await wk(), r0 = await t1();
  const prevOk = await ev("(()=>{const a=document.querySelector('#w_body a[aria-label=\"Previous week\"]');if(!a)return false;a.click();return true})()");
  if (!prevOk) return 'no enabled Previous week link on the newest week';
  if (!await wait(`location.hash!==${JSON.stringify(h0)}`)) return 'Previous did not change the route';
  await wait(`(document.querySelector('#w_body .wmid b')?.textContent||'')&&(document.querySelector('#w_body .wmid b')?.textContent||'')!==${JSON.stringify(r0)}`);
  const r1 = await t1(); if (r1 === r0 || !r1) return 'Previous did not change the week shown';
  if (!await ev("(()=>{const a=document.querySelector('#w_body a[aria-label=\"Next week\"]');if(!a)return false;a.click();return true})()")) return 'no Next week link after going back';
  if (!await wait(`(document.querySelector('#w_body .wmid b')?.textContent||'')===${JSON.stringify(r0)}`)) return 'Next did not return to the first week';
  return '';
});
await check('full history', '#/explore', q1('#loadbtn'), async () => {
  if (!await wait("document.querySelectorAll('#hist_body svg.lens_svg').length>=2", 20000)) return 'the history charts did not draw';
  await ev("(()=>{const b=document.getElementById('hist_body');b.querySelector('input[type=search]').value='rust';b.querySelector('form').dispatchEvent(new Event('submit',{cancelable:true}))})()");
  if (!await wait("document.querySelectorAll('#hist_body svg.lens_svg').length>=3", 20000)) return 'a word did not draw its series';
  if (!await wait("document.querySelectorAll('#hist_body .lens_top li').length>0", 20000)) return 'the month list did not show stories';
  return '';
});
await check('explorer', '#/explore', q1('#loadbtn'), async () => {
  await ev("(()=>{const s=document.getElementById('loadn');if(s&&s.options.length)s.selectedIndex=0;document.getElementById('loadbtn').click()})()");
  if (!await wait("/\\d.*matching/.test(document.getElementById('count').textContent)", 60000)) return 'explorer never showed a match count';
  // The list loads in parts: wait until the count stops moving before reading the baseline.
  const cnt = () => ev("+document.getElementById('count').textContent.replace(/[^0-9]/g,'')");
  const settle = async () => { let n = await cnt(), same = 0; for (let i = 0; i < 90 && same < 3; i++) { await new Promise(r => setTimeout(r, 1000)); const x = await cnt(); if (x === n) same++; else { same = 0; n = x; } } return n; };
  const n0 = await settle();
  await ev("(()=>{const e=document.getElementById('minscore');e.value='100';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))})()");
  await wait(`+document.getElementById('count').textContent.replace(/[^0-9]/g,'')!==${n0}`, 10000);
  const n1 = await settle();
  return n1 < n0 ? '' : `minimum score 100 did not reduce the count (${n0} to ${n1})`;
});
await check('explorer link', '#/explore?week=2026-W40&q=postgres&bad=1', q1('#loadbtn'), async () => {
  // The link fills the filters and loads by itself, no click.
  if (!await wait("/\\d.*matching/.test(document.getElementById('count').textContent)", 60000)) return 'a link did not load the explorer by itself';
  const v = await ev("JSON.stringify([document.getElementById('q').value,document.getElementById('from').value,document.getElementById('to').value])");
  return v === JSON.stringify(['postgres', '2026-09-28', '2026-10-04']) ? '' : 'link filters not applied: ' + v;
});
await check('explorer bad link', '#/explore', q1('#loadbtn'), async () => {
  await ev("document.getElementById('reset').click()");
  await ev("(()=>{location.hash='#/explore?week=nope&q=';window.ExploreLink()})()");
  const v = await ev("JSON.stringify([document.getElementById('q').value,document.getElementById('from').value,document.getElementById('to').value])");
  return v === JSON.stringify(['', '', '']) ? '' : 'a bad link changed the filters: ' + v;
});
ws.close(); ch.kill(); server?.close();
try { fs.rmSync(prof, { recursive: true, force: true }); if (tmp) fs.rmSync(tmp, { recursive: true, force: true }); } catch { }
const bad = results.filter(r => !r.ok).length;
console.log(bad ? `${bad} of ${results.length} checks failed` : `all ${results.length} checks passed`);
process.exit(bad ? 1 : 0);
