'use strict';
// Loads data/manifest.json -> CSV chunks (progressively), keeps columns in typed arrays,
// filters + charts + paginated list. Column names are mapped by alias so small schema changes are ok.
const ALIAS = {
  id: ['id', 'item_id'], time: ['time', 'timestamp', 'created_at', 'date', 'time_iso', 'time_unix'],
  by: ['by', 'author', 'user', 'username'], title: ['title', 'text_title'],
  url: ['url', 'link'], score: ['score', 'points'], comments: ['descendants', 'comments', 'num_comments'],
  type: ['type', 'kind'], domain: ['domain', 'host']
};
const $ = id => document.getElementById(id);
const D = { n: 0, id: [], time: [], score: [], comments: [], by: [], title: [], url: [], domain: [], type: [] };
let idx = new Uint32Array(0), page = 0; const PAGE = 25; const charts = {};
const host = u => { if (!u) return ''; try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const toSec = v => { if (v === '' || v == null) return 0; const n = +v; if (!isNaN(n)) return n > 1e11 ? n / 1000 : n; const t = Date.parse(v); return isNaN(t) ? 0 : t / 1000; };
const num = v => { const n = parseInt(v, 10); return isNaN(n) ? 0 : n; };
function colmap(header) {
  const low = header.map(h => h.trim().toLowerCase()), m = {};
  for (const k in ALIAS) { m[k] = -1; for (const a of ALIAS[k]) { const i = low.indexOf(a); if (i >= 0) { m[k] = i; break; } } }
  return m;
}
function addRows(rows, m) {
  for (const r of rows) {
    if (r.length < 2) continue;
    const g = k => m[k] >= 0 ? r[m[k]] : '';
    D.id.push(num(g('id'))); D.time.push(toSec(g('time'))); D.score.push(num(g('score'))); D.comments.push(num(g('comments')));
    D.by.push(g('by') || ''); D.title.push(g('title') || ''); const u = g('url') || ''; D.url.push(u);
    D.domain.push(g('domain') || host(u)); D.type.push(g('type') || ''); D.n++;
  }
}
function parseChunk(text, state) {
  return new Promise(res => {
    Papa.parse(text, { skipEmptyLines: true, complete: r => {
      let rows = r.data;
      if (!state.m) { state.m = colmap(rows[0]); rows = rows.slice(1); }
      addRows(rows, state.m); res();
    } });
  });
}
async function load() {
  let base = 'data/', sample = false, r0 = await fetch('data/manifest.json', { cache: 'no-cache' });
  if (!r0.ok) { base = 'sample/'; sample = true; r0 = await fetch('sample/manifest.json'); document.body.classList.add('sample'); $('banner').hidden = false; }
  const mf = await r0.json();
  const files = (mf.chunks || mf.files || []).map(f => typeof f === 'string' ? { path: f } : f);
  const total = files.reduce((a, f) => a + (f.rows || 0), 0);
  let k = 0;
  for (const f of files) {
    const path = f.path || f.file || f.name; const st = { m: null };
    const resp = await fetch(/^(data|sample)\//.test(path) ? path : base + path);
    if (!resp.ok) throw new Error('Failed ' + path);
    await parseChunk(await resp.text(), st);
    k++; $('barfill').style.width = (100 * k / files.length) + '%';
    $('status').textContent = `Loaded ${D.n.toLocaleString()}${total ? ' / ' + total.toLocaleString() : ''} posts (${k}/${files.length} files)`;
    if (k === 1 || k % 3 === 0 || k === files.length) { buildTypes(); refresh(); await new Promise(r => setTimeout(r)); }
  }
  $('status').textContent = `${D.n.toLocaleString()} posts loaded`;
  $('barfill').parentNode.style.display = 'none';
}
function buildTypes() {
  const s = new Set(D.type); const sel = $('type'), cur = sel.value;
  if (sel.options.length - 1 === s.size) return;
  sel.length = 1; [...s].filter(Boolean).sort().forEach(t => sel.add(new Option(t, t))); sel.value = cur;
}
function filter() {
  const words = $('q').value.toLowerCase().split(/\s+/).filter(Boolean);
  const by = $('by').value.trim().toLowerCase(), dom = $('domain').value.trim().toLowerCase().replace(/^www\./, '');
  const f = $('from').value ? Date.parse($('from').value) / 1000 : -Infinity;
  const t = $('to').value ? Date.parse($('to').value) / 1000 + 86400 : Infinity;
  const ty = $('type').value, ms = +$('minscore').value || 0, out = [];
  for (let i = 0; i < D.n; i++) {
    if (D.score[i] < ms) continue;
    const tm = D.time[i]; if (tm < f || tm >= t) continue;
    if (ty && D.type[i] !== ty) continue;
    if (by && !D.by[i].toLowerCase().includes(by)) continue;
    if (dom && !D.domain[i].toLowerCase().includes(dom)) continue;
    if (words.length) { const ti = D.title[i].toLowerCase(); let ok = true; for (const w of words) if (!ti.includes(w)) { ok = false; break; } if (!ok) continue; }
    out.push(i);
  }
  return Uint32Array.from(out);
}
function mkChart(id, cfg) {
  if (charts[id]) { charts[id].data = cfg.data; charts[id].update('none'); return; }
  cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } } }, cfg.options || {});
  charts[id] = new Chart($(id), cfg);
}
function top(keyArr, n) {
  const c = new Map(); for (const i of idx) { const k = keyArr[i]; if (k) c.set(k, (c.get(k) || 0) + 1); }
  return [...c].sort((a, b) => b[1] - a[1]).slice(0, n);
}
const AC = '#ff6600';
function drawCharts() {
  const month = new Map(), hours = new Array(24).fill(0), sb = new Array(8).fill(0);
  for (const i of idx) {
    const t = D.time[i]; if (t) { const d = new Date(t * 1000); const k = d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0'); month.set(k, (month.get(k) || 0) + 1); hours[d.getUTCHours()]++; }
    const s = D.score[i]; sb[s < 1 ? 0 : Math.min(7, 1 + Math.floor(Math.log10(s)) + (s >= 1 ? 0 : 0))]++;
  }
  const ml = [...month.keys()].sort();
  mkChart('c_month', { type: 'line', data: { labels: ml, datasets: [{ data: ml.map(k => month.get(k)), borderColor: AC, backgroundColor: AC + '55', fill: true, pointRadius: 0, tension: .2 }] }, options: { scales: { x: { ticks: { maxTicksLimit: 6 } } } } });
  mkChart('c_score', { type: 'bar', data: { labels: ['0', '1-9', '10-99', '100-999', '1k-9k', '10k+', '', ''].slice(0, 6), datasets: [{ data: [sb[0], sb[1], sb[2], sb[3], sb[4], sb[5] + sb[6] + sb[7]], backgroundColor: AC }] } });
  mkChart('c_hour', { type: 'bar', data: { labels: hours.map((_, h) => h), datasets: [{ data: hours, backgroundColor: AC }] }, options: { scales: { x: { ticks: { maxTicksLimit: 12 } } } } });
  const td = top(D.domain, 12), ta = top(D.by, 12);
  const hb = { indexAxis: 'y' };
  mkChart('c_dom', { type: 'bar', data: { labels: td.map(x => x[0]), datasets: [{ data: td.map(x => x[1]), backgroundColor: AC }] }, options: hb });
  mkChart('c_auth', { type: 'bar', data: { labels: ta.map(x => x[0]), datasets: [{ data: ta.map(x => x[1]), backgroundColor: AC }] }, options: hb });
}
function sorted() {
  const s = $('sort').value, a = Array.from(idx);
  const cmp = { score: (x, y) => D.score[y] - D.score[x], comments: (x, y) => D.comments[y] - D.comments[x], new: (x, y) => D.time[y] - D.time[x], old: (x, y) => D.time[x] - D.time[y] }[s];
  return a.sort(cmp);
}
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function drawList() {
  const a = sorted(), pages = Math.max(1, Math.ceil(a.length / PAGE)); if (page >= pages) page = pages - 1;
  $('list').innerHTML = a.slice(page * PAGE, page * PAGE + PAGE).map(i => {
    const hn = 'https://news.ycombinator.com/item?id=' + D.id[i], link = D.url[i] || hn;
    const d = D.time[i] ? new Date(D.time[i] * 1000).toISOString().slice(0, 10) : '';
    return `<li><a class="t" href="${esc(link)}" target="_blank" rel="noopener">${esc(D.title[i] || '(untitled)')}</a>${D.domain[i] ? ' <span class="m">(' + esc(D.domain[i]) + ')</span>' : ''}<div class="m">${D.score[i]} pts · by ${esc(D.by[i])} · ${d} · <a href="${hn}" target="_blank" rel="noopener">${D.comments[i]} comments</a></div></li>`;
  }).join('');
  $('page').textContent = `${page + 1} / ${pages}`; $('prev').disabled = page === 0; $('next').disabled = page >= pages - 1;
}
function refresh() { idx = filter(); $('count').textContent = `${idx.length.toLocaleString()} matching`; drawCharts(); drawList(); }
let tm; const deb = () => { clearTimeout(tm); tm = setTimeout(() => { page = 0; refresh(); }, 250); };
['q', 'by', 'domain', 'from', 'to', 'type', 'minscore'].forEach(id => $(id).addEventListener('input', deb));
$('sort').onchange = () => { page = 0; drawList(); };
$('prev').onclick = () => { page--; drawList(); scrollTo(0, $('results').offsetTop - 60); };
$('next').onclick = () => { page++; drawList(); scrollTo(0, $('results').offsetTop - 60); };
$('reset').onclick = () => { ['q', 'by', 'domain', 'from', 'to', 'type'].forEach(id => $(id).value = ''); $('minscore').value = 0; page = 0; refresh(); };
load().catch(e => { $('status').textContent = 'Error: ' + e.message; });
