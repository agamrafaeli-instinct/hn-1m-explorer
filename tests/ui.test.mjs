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
const port = 9800 + Math.floor(Math.random() * 150), prof = fs.mkdtempSync(path.join(os.tmpdir(), 'uic-'));
const ch = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=' + port, '--user-data-dir=' + prof, 'about:blank'], { stdio: 'ignore' });
let tabs; for (let i = 0; i < 60 && !tabs; i++) { await new Promise(r => setTimeout(r, 250)); try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { } }
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
await check('home', '#/', q1('#homeweek_s'), async () => (await ev(q1('#homeweek')) ? '' : 'no latest-week link'));
await check('audience', '#/a/engineers', q1('#aud_card article.hyp'));
await check('card', '#/c/h009/engineers', q1('#aud_card article.hyp'), async () => ((await ev("document.querySelectorAll('#aud_card article.hyp').length")) === 1 ? '' : 'expected exactly one card'));
const AUDN = { engineers: 'Engineers', vcs: 'Deep-tech VCs', geeks: 'Curious geeks' };
for (const a of ['engineers', 'vcs', 'geeks']) await check('week_' + a, '#/w/' + a, q1('#w_body .wsec'), async () => {
  const t = await ev('document.title'), d = await ev("document.querySelector('meta[name=description]').content");
  if (!t.startsWith(AUDN[a] + ': week ')) return 'page title is ' + t;
  if (!/\d{4}-W\d{2}/.test(t)) return 'title has no week';
  if (!d.includes(AUDN[a]) || d.length < 40) return 'description is ' + d;
  return '';
});
await check('stepper', '#/w/engineers', q1('#w_body .wsec'), async () => {
  const wk = () => ev("location.hash"), t1 = () => ev("document.querySelector('#w_body .wmid b')?.textContent||''");
  const h0 = await wk(), r0 = await t1();
  const prevOk = await ev("(()=>{const a=document.querySelector('#w_body a[aria-label=\"Previous week\"]');if(!a)return false;a.click();return true})()");
  if (!prevOk) return 'no enabled Previous week link on the newest week';
  if (!await wait(`location.hash!==${JSON.stringify(h0)}`)) return 'Previous did not change the route';
  await wait(`(document.querySelector('#w_body .wmid b')?.textContent||'')!==${JSON.stringify(r0)}`);
  const r1 = await t1(); if (r1 === r0 || !r1) return 'Previous did not change the week shown';
  if (!await ev("(()=>{const a=document.querySelector('#w_body a[aria-label=\"Next week\"]');if(!a)return false;a.click();return true})()")) return 'no Next week link after going back';
  if (!await wait(`(document.querySelector('#w_body .wmid b')?.textContent||'')===${JSON.stringify(r0)}`)) return 'Next did not return to the first week';
  return '';
});
await check('explorer', '#/explore', q1('#loadbtn'), async () => {
  await ev("(()=>{const s=document.getElementById('loadn');if(s&&s.options.length)s.selectedIndex=0;document.getElementById('loadbtn').click()})()");
  if (!await wait("/\\d.*matching/.test(document.getElementById('count').textContent)", 60000)) return 'explorer never showed a match count';
  // The list loads in parts: wait until the count stops moving before reading the baseline.
  const cnt = () => ev("+document.getElementById('count').textContent.replace(/[^0-9]/g,'')");
  let n0 = await cnt();
  for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 1000)); const x = await cnt(); if (x === n0) break; n0 = x; }
  await ev("(()=>{const e=document.getElementById('minscore');e.value='100';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))})()");
  await wait(`+document.getElementById('count').textContent.replace(/[^0-9]/g,'')!==${n0}`, 10000);
  const n1 = await ev("+document.getElementById('count').textContent.replace(/[^0-9]/g,'')");
  return n1 < n0 ? '' : `minimum score 100 did not reduce the count (${n0} to ${n1})`;
});
ws.close(); ch.kill(); server?.close();
try { fs.rmSync(prof, { recursive: true, force: true }); if (tmp) fs.rmSync(tmp, { recursive: true, force: true }); } catch { }
const bad = results.filter(r => !r.ok).length;
console.log(bad ? `${bad} of ${results.length} checks failed` : `all ${results.length} checks passed`);
process.exit(bad ? 1 : 0);
