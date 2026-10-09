#!/usr/bin/env node
// Load-time check on a throttled phone. Not published to the site.
// usage: node scripts/perf.mjs [--site URL | --serve DIR] [--tolerance 1.25] [--runs N] [--only name,name] [--write-budgets] [--budgets data/budgets.json]
// Settings (Lighthouse "slow 4G"): 150 ms round trip, 1.6 Mbps down, 750 kbps up, 4x CPU, 390x844 at 2x, cold cache.
// Prints one line per screen: median content time, requests, KB, horizontal overflow. Exits 1 if a screen is over budget
// or overflows sideways. Budgets: data/budgets.json = measured median + 15 percent (rounded up), see docs/BUDGETS.md.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import zlib from 'node:zlib';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true); };
// --serve DIR: serve a staged site folder on localhost with gzip (like Pages) so the check can run before deploy.
const TOL = +arg('tolerance', 1);
let SERVER = null, SERVE_URL = null;
if (arg('serve', false)) {
  const dir = path.resolve(String(arg('serve'))), types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.csv': 'text/csv', '.svg': 'image/svg+xml' };
  SERVER = http.createServer((q, r) => {
    let f = path.join(dir, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(dir)) { r.writeHead(403); return r.end(); }
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); }
    const ext = path.extname(f), body = fs.readFileSync(f), h = { 'content-type': types[ext] || 'application/octet-stream' };
    if (types[ext] && /gzip/.test(q.headers['accept-encoding'] || '')) { h['content-encoding'] = 'gzip'; r.writeHead(200, h); return r.end(zlib.gzipSync(body)); }
    r.writeHead(200, h); r.end(body);
  });
  await new Promise(ok => SERVER.listen(0, '127.0.0.1', ok)); SERVE_URL = `http://127.0.0.1:${SERVER.address().port}/`;
}
const SITE = String(SERVE_URL || arg('site', 'https://agamrafaeli-instinct.github.io/hn-1m-explorer/')).replace(/\/?$/, '/');
const RUNS = +arg('runs', 3), ONLY = arg('only', '') ? String(arg('only')).split(',') : null;
const BFILE = String(arg('budgets', 'data/budgets.json'));
// name, hash route, a selector that exists only when the content is really there, and optional text it must contain
export const SCREENS = [
  ['home', '#/', '#homeweek_s', '2026'],
  ['audience', '#/a/engineers', '#aud_card article.hyp', ''],
  ['card', '#/c/h009/engineers', '#aud_card article.hyp', ''],
  ['week_engineers', '#/w/engineers', '#w_body .wsec', ''],
  ['week_vcs', '#/w/vcs', '#w_body .wsec', ''],
  ['week_geeks', '#/w/geeks', '#w_body .wsec', ''],
  ['explorer', '#/explore', '#loadbtn', ''],
];
const median = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
async function once(url, sel, text) {
  const port = 9300 + Math.floor(Math.random() * 500), prof = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-'));
  const ch = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=' + port, '--user-data-dir=' + prof, 'about:blank'], { stdio: 'ignore' });
  try {
    let tabs; for (let i = 0; i < 40 && !tabs; i++) { await new Promise(r => setTimeout(r, 250)); try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { } }
    const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
    let id = 0, bytes = 0, reqs = 0; const pend = {};
    ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m.result); delete pend[m.id]; } if (m.method === 'Network.loadingFinished') { bytes += m.params.encodedDataLength; reqs++; } };
    const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
    await send('Network.enable'); await send('Page.enable'); await send('Runtime.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 204800, uploadThroughput: 93750 });
    await send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const t0 = Date.now(); await send('Page.navigate', { url });
    const expr = `(()=>{const e=document.querySelector(${JSON.stringify(sel)});return !!e&&(${JSON.stringify(text)}===''||e.textContent.includes(${JSON.stringify(text)}))})()`;
    let ms = null; for (let i = 0; i < 400; i++) { await new Promise(r => setTimeout(r, 25)); if ((await send('Runtime.evaluate', { expression: expr })).result.value) { ms = Date.now() - t0; break; } }
    await new Promise(r => setTimeout(r, 300));
    const ov = (await send('Runtime.evaluate', { expression: 'document.documentElement.scrollWidth-innerWidth' })).result.value;
    ws.close(); return { ms, reqs, kb: bytes / 1024, overflow: ov };
  } finally { const done = new Promise(r => ch.on('exit', r)); ch.kill(); await Promise.race([done, new Promise(r => setTimeout(r, 3000))]); try { fs.rmSync(prof, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { } }
}
const budgets = fs.existsSync(BFILE) ? JSON.parse(fs.readFileSync(BFILE)).screens : {};
const out = {}; let bad = 0;
for (const [name, route, sel, text] of SCREENS) {
  if (ONLY && !ONLY.includes(name)) continue;
  const rs = []; for (let i = 0; i < RUNS; i++) rs.push(await once(SITE + 'index.html' + route, sel, text));
  const ok = rs.filter(r => r.ms != null);
  if (!ok.length) { console.log(name.padEnd(16), 'FAIL content never appeared'); bad++; continue; }
  const m = { ms: median(ok.map(r => r.ms)), reqs: median(ok.map(r => r.reqs)), kb: Math.round(median(ok.map(r => r.kb))), overflow: Math.max(...ok.map(r => r.overflow)) };
  out[name] = m; const b = budgets[name]; const over = [];
  if (b) { if (m.ms > b.ms * TOL) over.push(`time ${m.ms}>${Math.round(b.ms * TOL)} ms`); if (m.kb > b.kb) over.push(`size ${m.kb}>${b.kb} KB`); if (m.reqs > b.reqs) over.push(`requests ${m.reqs}>${b.reqs}`); }
  if (m.overflow > 0) over.push(`sideways overflow ${m.overflow}px`);
  if (over.length) bad++;
  console.log(name.padEnd(16), `${m.ms} ms`.padStart(9), `${m.reqs} req`.padStart(8), `${m.kb} KB`.padStart(8), over.length ? 'OVER: ' + over.join('; ') : (b ? 'ok' : 'no budget'));
}
if (arg('write-budgets', false)) {
  const scr = {}; for (const [k, m] of Object.entries(out)) scr[k] = { ms: Math.ceil(m.ms * 1.15 / 50) * 50, kb: Math.ceil(m.kb * 1.15), reqs: Math.ceil(m.reqs * 1.15), measured: m };
  fs.writeFileSync(BFILE, JSON.stringify({ settings: { rtt_ms: 150, down_kbps: 1638, cpu_slowdown: 4, viewport: '390x844@2x', cache: 'cold', runs: RUNS, site: SITE, date: new Date().toISOString().slice(0, 10), rule: 'measured median + 15 percent, time rounded up to 50 ms' }, screens: scr }, null, 1) + '\n');
  console.log('wrote', BFILE);
}
if (SERVER) SERVER.close();
process.exit(bad ? 1 : 0);
