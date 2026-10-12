// QA reviewer (#254). Walks routes of the site at 390 px as a visitor and writes a short report for one ticket: a screenshot per route,
// the text a visitor reads, and a list of findings (sideways scroll, small tap targets, unlabeled controls and charts, images without alt,
// tiny text, empty sections, "undefined"/"NaN" in the text, banned words, console errors, failed requests).
// Report only: it always exits 0 and never blocks anything. The ticket's done-when list is printed next to the walk so a reader can compare them.
//   node scripts/qa_review.mjs --ticket 276 --routes '#/,#/rings' [--site URL] [--out DIR] [--shots-url BASE]
// With no --site it stages the repo and serves it locally. --shots-url sets the public address the report uses for the screenshots.
import {spawn, execFileSync} from 'node:child_process';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d = null) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const ticket = arg('ticket', ''), routes = (arg('routes', '#/') || '#/').split(',').map(s => s.trim()).filter(Boolean);
const out = path.resolve(arg('out', '/tmp/qa_' + (ticket || 'x'))), shotsUrl = arg('shots-url', '');
fs.mkdirSync(out, { recursive: true });
let SITE = arg('site'), server;
if (!SITE) {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'qa-')), 'site');
  execFileSync('python3', [path.join(root, 'scripts/stage_site.py'), '--output', dir], { cwd: root, stdio: 'ignore' });
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.csv': 'text/csv', '.svg': 'image/svg+xml' };
  server = http.createServer((q, r) => { let f = path.join(dir, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!f.startsWith(dir) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); });
  await new Promise(ok => server.listen(0, '127.0.0.1', ok)); SITE = `http://127.0.0.1:${server.address().port}/`;
}
SITE = SITE.replace(/\/?$/, '/');
let crit = '';
if (ticket) { try { const body = execFileSync('gh', ['issue', 'view', ticket, '-R', 'agamrafaeli-instinct/hn-1m-explorer', '--json', 'title,body', '-q', '.title + "\\n" + .body'], { encoding: 'utf8' });
  crit = body.split('\n').filter((l, i) => i === 0 || /^- \[[ x]\]/.test(l)).join('\n'); } catch { crit = '(ticket text not readable here)'; } }
const port = 9500 + Math.floor(Math.random() * 200);
const ch = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--remote-debugging-port=' + port, '--user-data-dir=' + fs.mkdtempSync(path.join(os.tmpdir(), 'qac-')), 'about:blank'], { stdio: 'ignore' });
let tabs; for (let i = 0; i < 60 && !tabs; i++) { await new Promise(r => setTimeout(r, 500)); try { const t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.some(x => x.type === 'page')) tabs = t; } catch { } }
if (!tabs) { console.error('chrome did not start (report only, so no failure)'); process.exit(0); }
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = {}, probs = [], urls = {};
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m.result); delete pend[m.id]; return; } const p = m.params || {};
  if (m.method === 'Runtime.exceptionThrown') probs.push('exception: ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text).slice(0, 120));
  if (m.method === 'Runtime.consoleAPICalled' && p.type === 'error') probs.push('console.error: ' + p.args.map(a => a.value ?? a.description).join(' ').slice(0, 120));
  if (m.method === 'Network.requestWillBeSent') urls[p.requestId] = p.request.url;
  if (m.method === 'Network.loadingFailed' && !p.canceled) probs.push('failed request: ' + (urls[p.requestId] || '?'));
  if (m.method === 'Network.responseReceived' && p.response.status >= 400 && !/favicon/.test(p.response.url)) probs.push('HTTP ' + p.response.status + ': ' + p.response.url); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
await send('Network.enable'); await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
// Same list as scripts/copy_lint.py (kept in pieces here so the lint does not flag its own list).
const BANNED = new RegExp(['\\bvotes\\b', '\\b1M\\b', 'the last mil' + 'lion', '\\u2014', '&md' + 'ash;', '\\bdel' + 've\\b', '\\bcru' + 'cial\\b', '\\bpivo' + 'tal\\b', '\\blever' + 'ag(e|es|ing)\\b', '\\bstream' + 'line', '\\bholi' + 'stic', '\\brob' + 'ust\\b', '\\bseam' + 'less', '\\bempo' + 'wer', '\\bun' + 'lock', 'game-' + 'changing', "we're ex" + 'cited', 'in or' + 'der to', '\\bsim' + 'ply\\b', '\\bpower' + 'ful\\b', '\\bcompre' + 'hensive\\b'].join('|'), 'gi');
const expr = `(()=>{const vis=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
const nm=e=>((e.labels&&e.labels[0]&&e.labels[0].innerText)||e.innerText||e.getAttribute('aria-label')||e.title||e.value||'').trim();
const tap=[],unl=[],noalt=[],tiny=new Set(),empty=[];
for(const e of document.querySelectorAll('a[href],button,input:not([type=hidden]),select,summary')){if(!vis(e))continue;const r=e.getBoundingClientRect(),s=getComputedStyle(e);
 if(!nm(e)&&!e.querySelector('img[alt],svg[aria-label]'))unl.push(e.tagName.toLowerCase()+' '+e.outerHTML.slice(0,40).replace(/\\s+/g,' '));
 if(s.display==='inline'&&e.tagName==='A')continue;if(r.width<44||r.height<44)tap.push((nm(e)||'(none)').slice(0,24)+' '+Math.round(r.width)+'x'+Math.round(r.height));}
for(const i of document.querySelectorAll('img'))if(vis(i)&&!i.hasAttribute('alt'))noalt.push((i.getAttribute('src')||'').slice(0,50));
const svgs=[...document.querySelectorAll('svg')].filter(s=>vis(s)&&s.getBoundingClientRect().width>40&&!s.getAttribute('aria-label')&&!s.getAttribute('aria-hidden')&&!s.querySelector('title')&&!s.closest('[aria-hidden=true],[role=img]')).length;
const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const t=n.textContent.trim();if(t.length<2||!n.parentElement||!vis(n.parentElement))continue;const fs=parseFloat(getComputedStyle(n.parentElement).fontSize);if(fs<12)tiny.add(Math.round(fs*10)/10+'px: '+t.slice(0,30));}
for(const h of document.querySelectorAll('h2,h3'))if(vis(h)&&h.innerText.trim()){const nx=h.nextElementSibling;if(!nx||!(nx.innerText||'').trim()&&!nx.querySelector('svg,img,canvas'))empty.push(h.innerText.trim().slice(0,40));}
return JSON.stringify({title:document.title,h1:([...document.querySelectorAll('h1')].find(vis)||{}).innerText||'',text:(document.body.innerText||'').replace(/\\s+/g,' ').trim(),scroll:document.documentElement.scrollWidth-innerWidth,height:document.documentElement.scrollHeight,tap,unl,noalt,svgs,tiny:[...tiny].slice(0,5),empty});})()`;
const rows = []; let n = 0;
for (const route of routes) {
  const before = probs.length; await send('Page.navigate', { url: SITE + 'index.html' + route });
  await new Promise(r => setTimeout(r, 2500));
  const v = JSON.parse((await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value);
  const shot = `${String(++n).padStart(2, '0')}.jpg`;
  const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 55, captureBeyondViewport: true, clip: { x: 0, y: 0, width: 390, height: Math.min(v.height, 2400), scale: 1 } });
  fs.writeFileSync(path.join(out, shot), Buffer.from(s.data, 'base64'));
  const f = [];
  if (v.scroll > 0) f.push(`sideways scroll ${v.scroll}px`);
  if (v.tap.length) f.push(`${v.tap.length} tap target(s) under 44px, e.g. ${v.tap.slice(0, 3).join('; ')}`);
  if (v.unl.length) f.push(`${v.unl.length} control(s) with no name`);
  if (v.svgs) f.push(`${v.svgs} chart(s) with no name`);
  if (v.noalt.length) f.push(`${v.noalt.length} image(s) with no alt`);
  if (v.tiny.length) f.push('text under 12px: ' + v.tiny.slice(0, 3).join('; '));
  if (v.empty.length) f.push('heading with nothing under it: ' + v.empty.join('; '));
  if (/\b(undefined|NaN|\[object|null)\b/.test(v.text)) f.push('"undefined", "NaN" or "null" shows in the text');
  const b = [...new Set((v.text.match(BANNED) || []).map(x => x.toLowerCase()))]; if (b.length) f.push('banned word(s): ' + b.join(', '));
  if (v.text.length < 80) f.push('very little text on the page (' + v.text.length + ' characters)');
  for (const p of probs.slice(before)) f.push(p);
  rows.push({ route, shot, ...v, findings: f });
}
ws.close(); ch.kill(); server?.close();
const L = [`## QA walk${ticket ? ' for #' + ticket : ''} (390 px, report only)`, '', `Site: ${SITE.startsWith('http://127') ? 'staged from the repo' : SITE}. ${rows.length} route(s). This walk lists what a script can see. Whether the copy reads well and a chart is clear is for the person reading the screenshots below.`, ''];
if (crit) L.push('**Ticket and its done-when list**', '', ...crit.split('\n').map((l, i) => i ? l : '> ' + l), '');
const total = rows.reduce((a, r) => a + r.findings.length, 0);
L.push(`**Findings: ${total}**`, '');
for (const r of rows) {
  L.push(`### \`${r.route}\` ${r.h1 ? '- ' + r.h1.slice(0, 70) : ''}`);
  L.push(r.findings.length ? r.findings.map(x => '- ' + x).join('\n') : '- nothing flagged');
  L.push('', shotsUrl ? `![${r.route}](${shotsUrl}/${r.shot})` : `(screenshot: ${r.shot})`, '', '<details><summary>Text a visitor reads</summary>', '', r.text.slice(0, 1200) + (r.text.length > 1200 ? ' ...' : ''), '', '</details>', '');
}
fs.writeFileSync(path.join(out, 'report.md'), L.join('\n')); fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(rows, null, 1));
console.log(L.join('\n').replace(/<\/?details>|<summary>.*<\/summary>/g, '')); console.log('\nreport:', path.join(out, 'report.md'));
process.exit(0);
