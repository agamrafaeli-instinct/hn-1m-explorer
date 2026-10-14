// Acceptance checks per ticket (#251). Each ticket has tests/acceptance/<n>.mjs that turns its done-when list into code.
//   node scripts/acceptance.mjs 265                 stage the repo, serve it locally, run the checks
//   node scripts/acceptance.mjs 265 --site URL      run against a deployed site (live or a preview)
//   node scripts/acceptance.mjs --all [--site URL]  every file in tests/acceptance
// A check file default-exports async (t) => { await t.open('#/'); t.ok(await t.js('document.title'), 'has a title'); }.
// t.open(route), t.js(expr) (value of an expression, after load), t.ok(cond, msg), t.equal(a, b, msg), t.text(sel), t.count(sel), t.click(sel), t.wait(ms).
// Mobile 390 px. Exit 1 if any check fails.
import {spawn, execFileSync} from 'node:child_process';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import {pathToFileURL, fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => { const i = process.argv.indexOf('--' + k); return i < 0 ? null : process.argv[i + 1]; };
const all = process.argv.includes('--all'), nums = process.argv.slice(2).filter((a,i,all) => /^\d+$/.test(a) && !(all[i-1]||'').startsWith('--'));
const dir0 = path.join(root, 'tests/acceptance');
const files = all ? fs.readdirSync(dir0).filter(f => /^\d+\.mjs$/.test(f)).sort() : nums.map(n => n + '.mjs');
if (!files.length) { console.error('usage: acceptance.mjs <ticket number>... | --all  [--site URL]'); process.exit(2); }
let SITE = arg('site'), server;
if (!SITE) {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'acc-')), 'site');
  execFileSync('python3', [path.join(root, 'scripts/stage_site.py'), '--output', dir], { cwd: root, stdio: 'ignore' });
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.csv': 'text/csv', '.svg': 'image/svg+xml' };
  server = http.createServer((q, r) => { let f = path.join(dir, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!f.startsWith(dir) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); });
  await new Promise(ok => server.listen(0, '127.0.0.1', ok)); SITE = `http://127.0.0.1:${server.address().port}/`;
}
SITE = SITE.replace(/\/?$/, '/');
const port = 9600 + Math.floor(Math.random() * 150);
const ch = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--remote-debugging-port=' + port, '--user-data-dir=' + fs.mkdtempSync(path.join(os.tmpdir(), 'acc-')), 'about:blank'], { stdio: 'ignore' });
let tabs; for (let i = 0; i < 40 && !tabs; i++) { await new Promise(r => setTimeout(r, 1000)); try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { } }
if (!tabs) { console.error('chrome debug port never opened'); process.exit(2); }
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = {}; ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m.result); delete pend[m.id]; } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { width: Number(arg('width', 390)), height: 844, deviceScaleFactor: 1, mobile: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
const js = async expr => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); return r.exceptionDetails ? undefined : r.result.value; };
let pass = 0, fail = 0, cur = '';
const t = {
  async open(route) { await send('Page.navigate', { url: SITE + 'index.html' }); await wait(1500); await js(`location.hash=${JSON.stringify(route)}`); await wait(2500); },
  js, wait, text: sel => js(`(document.querySelector(${JSON.stringify(sel)})||{}).innerText`), count: sel => js(`document.querySelectorAll(${JSON.stringify(sel)}).length`),
  click: sel => js(`(document.querySelector(${JSON.stringify(sel)})||{click(){}}).click()`),
  ok(c, msg) { if (c) { pass++; console.log('  PASS', msg); } else { fail++; console.log('  FAIL', msg, '[' + cur + ']'); } },
  equal(a, b, msg) { t.ok(a === b, msg + (a === b ? '' : ` (got ${JSON.stringify(a)}, wanted ${JSON.stringify(b)})`)); },
};
for (const f of files) {
  cur = '#' + f.replace('.mjs', ''); console.log(cur);
  try { await (await import(pathToFileURL(path.join(dir0, f)).href)).default(t); } catch (e) { fail++; console.log('  FAIL check crashed:', e.message); }
}
console.log(`acceptance: ${pass} passed, ${fail} failed`);
ch.kill(); if (server) server.close(); process.exit(fail ? 1 : 0);
