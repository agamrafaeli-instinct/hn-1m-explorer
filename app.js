'use strict';
// Loads data/manifest.json -> CSV chunks (progressively), keeps columns in typed arrays,
// filters + charts + paginated list. Column names are mapped by alias so small schema changes are ok.
const ALIAS = {
  id: ['id', 'item_id'], time: ['time', 'timestamp', 'created_at', 'date', 'time_iso', 'time_unix'],
  by: ['by', 'author', 'user', 'username'], title: ['title', 'text_title'],
  url: ['url', 'link'], score: ['score', 'points'], comments: ['descendants', 'comments', 'num_comments'],
  type: ['type', 'kind'], domain: ['domain', 'host'], text: ['text']
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
    let ti = g('title'); if (!ti) { const tx = g('text'); ti = tx ? '[' + (g('type') || 'item') + '] ' + tx.replace(/<[^>]*>/g, ' ').replace(/&[#\w]+;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140) : ''; }
    D.by.push(g('by') || ''); D.title.push(ti); const u = g('url') || ''; D.url.push(u);
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
const vend = {};
function vendor(src) { return vend[src] || (vend[src] = new Promise((ok, no) => { const e = document.createElement('script'); e.src = src; e.onload = ok; e.onerror = no; document.head.appendChild(e); })); }
window.ExploreVendor = () => Promise.all([vendor('vendor/papaparse.min.js'), vendor('vendor/chart.umd.js')]);
let loadedFiles = 0, busy = false;
async function load(nChunks) {
  busy = true; try { await load1(nChunks); } finally { busy = false; loadedFiles = loadedFiles || 0; refresh(); }
}
async function load1(nChunks) {
  await window.ExploreVendor();
  let base = 'data/', sample = false, r0 = await fetch('data/manifest.json', { cache: 'no-cache' });
  if (!r0.ok) { base = 'sample/'; sample = true; r0 = await fetch('sample/manifest.json'); document.body.classList.add('sample'); $('banner').hidden = false; }
  const mf = await r0.json();
  let files = (mf.chunks || mf.files || []).map(f => typeof f === 'string' ? { path: f } : f);
  if (nChunks && nChunks < files.length) files = files.slice(0, nChunks);
  loadedFiles = files.length;
  const total = files.reduce((a, f) => a + (f.rows || 0), 0);
  let k = 0;
  for (const f of files) {
    const path = f.path || f.file || f.name; const st = { m: null };
    const resp = await fetch(/^(data|sample)\//.test(path) ? path : base + path);
    if (!resp.ok) throw new Error('no file at ' + path);
    await parseChunk(await resp.text(), st);
    k++; $('barfill').style.width = (100 * k / files.length) + '%';
    $('status').textContent = `Loaded ${D.n.toLocaleString()}${total ? ' / ' + total.toLocaleString() : ''} posts (${k}/${files.length} files)`;
    if (k === 1 || k % 3 === 0 || k === files.length) { buildTypes(); refresh(); await new Promise(r => setTimeout(r)); }
  }
  { let lo = Infinity, hi = 0; for (let i = 0; i < D.n; i++) { const t = D.time[i]; if (t > 0) { if (t < lo) lo = t; if (t > hi) hi = t; } }
    const dd = t => new Date(t * 1000).toISOString().slice(0, 10);
    $('status').textContent = `${D.n.toLocaleString()} posts loaded` + (hi ? `, from ${dd(lo)} to ${dd(hi)}` : ''); }
  $('load_src').textContent = `Source: ${D.n.toLocaleString()} posts from ${files.length} data file${files.length === 1 ? '' : 's'}${sample ? ' (the small sample, not the full archive)' : ''}, listed in ${base}manifest.json${mf.generated_at ? ', built ' + mf.generated_at.slice(0, 10) : ''}.`;
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
  // Whole word: the word must stand between characters that are not letters or digits.
  const wres = $('whole').checked ? words.map(w => new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])')) : null;
  for (let i = 0; i < D.n; i++) {
    if (D.score[i] < ms) continue;
    const tm = D.time[i]; if (tm < f || tm >= t) continue;
    if (ty && D.type[i] !== ty) continue;
    if (by && !D.by[i].toLowerCase().includes(by)) continue;
    if (dom && !D.domain[i].toLowerCase().includes(dom)) continue;
    if (words.length) { const ti = D.title[i].toLowerCase(); let ok = true; if (wres) { for (const re of wres) if (!re.test(ti)) { ok = false; break; } } else for (const w of words) if (!ti.includes(w)) { ok = false; break; } if (!ok) continue; }
    out.push(i);
  }
  return Uint32Array.from(out);
}
function mkChart(id, cfg) {
  if (charts[id]) { charts[id].data = cfg.data; charts[id].update('none'); return; }
  cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } } }, cfg.options || {});
  charts[id] = new Chart($(id), cfg);
}
function topN(keyArr, n) {
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
  const td = topN(D.domain, 12), ta = topN(D.by, 12);
  const pick = field => (ev, els, ch) => { if (!els.length) return; const v = ch.data.labels[els[0].index]; $(field).value = v; page = 0; keepFilters(); refresh(); };
  const hb = f => ({ indexAxis: 'y', onClick: pick(f), onHover: (ev, els) => { ev.native.target.style.cursor = els.length ? 'pointer' : 'default'; } });
  mkChart('c_dom', { type: 'bar', data: { labels: td.map(x => x[0]), datasets: [{ data: td.map(x => x[1]), backgroundColor: AC }] }, options: hb('domain') });
  mkChart('c_auth', { type: 'bar', data: { labels: ta.map(x => x[0]), datasets: [{ data: ta.map(x => x[1]), backgroundColor: AC }] }, options: hb('by') });
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
    return `<li><a class="t" href="${esc(link)}" target="_blank" rel="noopener">${esc(D.title[i] || '(untitled)')}</a>${D.domain[i] ? ' <span class="m">(' + esc(D.domain[i]) + ')</span>' : ''}<div class="m">${D.score[i]} pts · by ${esc(D.by[i])} · ${d} · <a href="${hn}" target="_blank" rel="noopener">${D.comments[i]} ${D.comments[i] === 1 ? "comment" : "comments"}</a></div></li>`;
  }).join('');
  $('page').textContent = `${page + 1} / ${pages}`; $('prev').disabled = page === 0; $('next').disabled = page >= pages - 1;
}
const STOPW = new Set('a an the of to in on for and or with is are was how why what my your you we it this that at by from as be do not can new'.split().concat(['i']));
function lensCalc() {
  const k = $('lens_k').value, m = $('lens_m').value, g = new Map(), WDN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], MNN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let tot = 0;
  for (const i of idx) {
    const w = m === 'posts' ? 1 : m === 'points' ? D.score[i] : D.comments[i]; let keys;
    if (k === 'word') keys = new Set((D.title[i].toLowerCase().match(/[a-z][a-z']+/g) || []).filter(x => x.length > 2 && !STOPW.has(x)));
    else if (k === 'hour' || k === 'weekday' || k === 'month') { const d = new Date(D.time[i] * 1000); keys = [k === 'hour' ? String(d.getUTCHours()).padStart(2, '0') + ':00' : k === 'weekday' ? WDN[(d.getUTCDay() + 6) % 7] : MNN[d.getUTCMonth()]]; }
    else keys = [D[k === 'by' ? 'by' : k][i]];
    tot += w; for (const x of keys) if (x) g.set(x, (g.get(x) || 0) + w);
  }
  const arr = [...g].sort((a, b) => b[1] - a[1]), n = arr.length, share = f => { const c = Math.max(1, Math.ceil(n * f)); let s = 0; for (let i = 0; i < c; i++) s += arr[i][1]; return tot ? s / tot : 0; };
  const mx = arr.length ? arr[0][1] : 1, P = v => (100 * v).toFixed(v >= .1 ? 0 : 1) + '%';
  const cal = ['hour', 'weekday', 'month'].includes(k), rows = cal ? arr.slice().sort((a, b) => a[0] < b[0] ? -1 : 1) : arr.slice(0, 15);
  $('lens_out').innerHTML = (n ? `<p class="m" style="font-size:14px;color:inherit">${n.toLocaleString()} distinct. Top 1% hold <b>${P(share(.01))}</b> of ${m}, top 10% hold <b>${P(share(.1))}</b>, the single heaviest holds <b>${P(tot ? mx / tot : 0)}</b>.</p>` : '<p class="m">No matches.</p>') +
    rows.map(r => `<div class="br" style="margin:4px 0"><div class="nm" title="${esc(r[0])}">${esc(r[0])}</div><div class="tr"><div class="fl" style="width:${(70 * r[1] / mx).toFixed(1)}%"></div><span class="vl">${r[1].toLocaleString()} · ${P(tot ? r[1] / tot : 0)}</span></div></div>`).join('');
}
['lens_k', 'lens_m'].forEach(id => $(id).addEventListener('input', () => lensCalc()));
function noMatch() {
  const el = $('nomatch'); if (!el) return;
  if (idx.length) { el.hidden = true; return; }
  const set = [['q', 'Word'], ['by', 'Author'], ['domain', 'Domain'], ['from', 'From'], ['to', 'To'], ['type', 'Type']].filter(([id]) => $(id).value).map(([id, n]) => n + ' "' + $(id).value + '"');
  if (+$('minscore').value > 0) set.push('Minimum score ' + $('minscore').value);
  el.textContent = set.length ? 'No posts match: ' + set.join(', ') + '. Loosen one of these, or ' : 'No posts in the loaded slice. ';
  const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Reset the filters'; b.onclick = () => $('reset').click(); el.appendChild(b);
  el.hidden = false;
}
function moreNote() {
  const el = $('moreslice'); if (!el) return;
  const best = $('loadn').querySelector('option[selected]'), n = best ? +best.value : 0;
  if (busy || !n || !loadedFiles || loadedFiles >= n || !D.n) { el.hidden = true; return; }
  let lo = Infinity, hi = 0; for (let i = 0; i < D.n; i++) { const t = D.time[i]; if (t > 0) { if (t < lo) lo = t; if (t > hi) hi = t; } }
  const d = t => new Date(t * 1000).toISOString().slice(0, 10), sz = (best.textContent.split(', ~')[1] || '').trim();
  $('moreslice_t').textContent = `Searching only the newest ${D.n.toLocaleString()} posts${hi ? ' (' + d(lo) + (d(lo) === d(hi) ? '' : ' to ' + d(hi)) + ')' : ''}. The archive is much bigger.`;
  $('moreslice_btn').textContent = 'Search more' + (sz ? ' (about ' + sz + ')' : '');
  el.hidden = false;
}
$('moreslice_btn').onclick = async () => {
  const best = $('loadn').querySelector('option[selected]'); if (!best) return;
  $('moreslice_btn').disabled = true;
  for (const k of Object.keys(D)) if (Array.isArray(D[k])) D[k].length = 0; D.n = 0;
  $('loadn').value = best.value; $('bar').style.display = 'block'; $('barfill').parentNode.style.display = '';
  try { await load(+best.value); } catch (e) { $('status').textContent = 'Could not load (' + e.message + '). Try again.'; }
  $('moreslice_btn').disabled = false;
};
function chips() {
  const box = $('fchips'); if (!box) return;
  const L = [['q', 'Word'], ['by', 'Author'], ['domain', 'Domain'], ['from', 'From'], ['to', 'To'], ['type', 'Type']].filter(([id]) => $(id).value).map(([id, n]) => [n + ': ' + $(id).value, () => { $(id).value = ''; }]);
  if (+$('minscore').value > 0) L.push(['Min score: ' + $('minscore').value, () => { $('minscore').value = 0; }]);
  if ($('whole').checked) L.push(['Whole word', () => { $('whole').checked = false; }]);
  box.replaceChildren(...L.map(([t, f]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'fchip'; b.textContent = t + ' \u00d7'; b.setAttribute('aria-label', 'Clear filter ' + t); b.onclick = () => { f(); page = 0; keepFilters(); refresh(); }; return b; }));
  box.hidden = !L.length; $('reset').hidden = !L.length;
}
function dateRange() {
  const el = $('daterange'); if (!el) return;
  let lo = Infinity, hi = 0; for (const i of idx) { const t = D.time[i]; if (t > 0) { if (t < lo) lo = t; if (t > hi) hi = t; } }
  if (!hi) { el.hidden = true; return; }
  const d = t => new Date(t * 1000).toISOString().slice(0, 10);
  el.textContent = `Matches run from ${d(lo)} to ${d(hi)}, among the posts loaded.`; el.hidden = false;
}
function ptShare() {
  const el = $('ptshare'); if (!el) return;
  if (!idx.length) { el.hidden = true; return; }
  let m = 0, all = 0; for (let i = 0; i < D.n; i++) all += D.score[i]; for (const i of idx) m += D.score[i];
  const pc = all ? 100 * m / all : 0, t = pc >= 10 ? pc.toFixed(0) : pc >= 1 ? pc.toFixed(1) : pc.toFixed(2);
  el.textContent = `These hold ${m.toLocaleString()} points, ${t}% of the ${all.toLocaleString()} points in the ${D.n.toLocaleString()} posts loaded.`; el.hidden = false;
}
function qSync() { ['q', 'by', 'domain'].forEach(id => { $(id + 'clear').hidden = !$(id).value; }); }
function refresh() { qSync(); idx = filter(); lensCalc(); $('count').textContent = `${idx.length.toLocaleString()} matching`; $('rcount').textContent = idx.length === 1 ? '1 post matches these filters.' : `${idx.length.toLocaleString()} posts match these filters.`; noMatch(); ptShare(); dateRange(); chips(); moreNote(); drawCharts(); drawList(); }
let tm; const deb = () => { clearTimeout(tm); tm = setTimeout(() => { page = 0; refresh(); }, 250); };
['q', 'by', 'domain', 'from', 'to', 'type', 'minscore'].forEach(id => $(id).addEventListener('input', deb));
$('whole').addEventListener('change', deb);
// Keep the filters in the address, so Back from a story card brings them back. replaceState does not add history entries.
const keepFilters = () => { if (!/^#\/explore/.test(location.hash)) return; const u = new URLSearchParams(); [['q', 'q'], ['by', 'by'], ['domain', 'domain'], ['from', 'from'], ['to', 'to'], ['type', 'type'], ['min', 'minscore']].forEach(([k, id]) => { const v = $(id).value; if (v && v !== '0') u.set(k, v); }); if ($('sort').value !== 'score') u.set('sort', $('sort').value); if ($('whole').checked) u.set('whole', '1'); const t = u.toString(); try { if (t) sessionStorage.setItem('hn_filters', t); else sessionStorage.removeItem('hn_filters'); } catch (e) { } history.replaceState(null, '', location.pathname + location.search + '#/explore' + (t ? '?' + t : '')); };
['q', 'by', 'domain', 'from', 'to', 'type', 'minscore'].forEach(id => $(id).addEventListener('input', keepFilters));
$('sort').addEventListener('change', keepFilters);
$('whole').addEventListener('change', keepFilters);
$('reset').addEventListener('click', () => setTimeout(keepFilters, 0));
$('csv').onclick = () => {
  const CAP = 50000, a = sorted(), n = Math.min(a.length, CAP);
  const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const L = ['id,date,score,comments,author,domain,title'];
  for (let k = 0; k < n; k++) { const i = a[k]; L.push([D.id[i], D.time[i] ? new Date(D.time[i] * 1000).toISOString().slice(0, 10) : '', D.score[i], D.comments[i], q(D.by[i]), q(D.domain[i]), q(D.title[i])].join(',')); }
  const u = URL.createObjectURL(new Blob(['\ufeff' + L.join('\r\n') + '\r\n'], { type: 'text/csv' })), x = document.createElement('a');
  x.href = u; x.download = 'hn-matches.csv'; document.body.appendChild(x); x.click(); x.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000);
  $('csvnote').textContent = a.length > CAP ? `Saved the first ${CAP.toLocaleString()} of ${a.length.toLocaleString()} matches. Narrow the filters to get the rest.` : `Saved ${n.toLocaleString()} match${n === 1 ? '' : 'es'}.`;
};
$('copyfilters').onclick = async () => {
  const b = $('copyfilters'), url = location.href; let ok = false;
  try { await navigator.clipboard.writeText(url); ok = true; } catch (err) { const t = document.createElement('textarea'); t.value = url; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); try { ok = document.execCommand('copy'); } catch (e2) { } t.remove(); }
  if (ok) { b.textContent = 'Link copied'; setTimeout(() => { b.textContent = 'Copy link to these filters'; }, 2000); return; }
  let f = b.parentNode.querySelector('input.share_link');
  if (!f) { f = document.createElement('input'); f.className = 'share_link'; f.readOnly = true; f.setAttribute('aria-label', 'Link to copy'); f.style.cssText = 'display:block;width:100%;box-sizing:border-box;margin:8px 0;padding:10px;font-size:16px'; b.after(f); }
  f.value = url; f.focus(); f.select(); b.textContent = 'Copy the link below'; setTimeout(() => { b.textContent = 'Copy link to these filters'; }, 4000);
};
$('sort').onchange = () => { page = 0; drawList(); };
$('prev').onclick = () => { page--; drawList(); scrollTo(0, $('results').offsetTop - 60); };
$('next').onclick = () => { page++; drawList(); scrollTo(0, $('results').offsetTop - 60); };
['q', 'by', 'domain'].forEach(id => $(id).addEventListener('input', qSync));
['by', 'domain'].forEach(id => { $(id + 'clear').onclick = () => { $(id).value = ''; qSync(); page = 0; refresh(); keepFilters(); $(id).focus(); }; });
$('qclear').onclick = () => { $('q').value = ''; qSync(); page = 0; refresh(); keepFilters(); $('q').focus(); };
$('reset').onclick = () => { ['q', 'by', 'domain', 'from', 'to', 'type'].forEach(id => $(id).value = ''); $('whole').checked = false; $('minscore').value = 0; page = 0; refresh(); };
$('loadbtn').onclick = () => { $('loadbtn').disabled = true; $('loadn').disabled = true; $('app').hidden = false; $('bar').style.display = 'block'; load(+$('loadn').value).catch(e => { $('status').textContent = 'Could not load (' + e.message + '). Try again.'; }); };

// Link into the explorer: #/explore?week=2026-W40&q=postgres. Bad values are ignored. (#189)
function isoWeekRange(w) {
  const m = /^(\d{4})-W(\d{2})$/.exec(w || ''); if (!m || +m[2] < 1 || +m[2] > 53) return null;
  const jan4 = Date.UTC(+m[1], 0, 4), dow = (new Date(jan4).getUTCDay() + 6) % 7, mon = jan4 - dow * 864e5 + (+m[2] - 1) * 7 * 864e5;
  const f = t => new Date(t).toISOString().slice(0, 10); return [f(mon), f(mon + 6 * 864e5)];
}
window.ExploreLink = () => {
  let hq = location.hash.split('?')[1] || ''; if (!hq) { try { hq = sessionStorage.getItem('hn_filters') || ''; } catch (e) { } }
  const qs = new URLSearchParams(hq), q = (qs.get('q') || '').slice(0, 80), wk = isoWeekRange(qs.get('week'));
  const more = {}; ['by', 'domain', 'type'].forEach(k => { const v = (qs.get(k) || '').slice(0, 80); if (v) more[k] = v; });
  ['from', 'to'].forEach(k => { const v = qs.get(k) || ''; if (/^\d{4}-\d{2}-\d{2}$/.test(v)) more[k] = v; });
  if (qs.get('whole') === '1') more.whole = 1;
  const so = qs.get('sort'); if (['score', 'comments', 'new', 'old'].includes(so)) more.sort = so;
  const mn = Math.floor(+qs.get('min')); if (mn > 0 && mn < 1e6) more.minscore = mn;
  if (!q && !wk && !Object.keys(more).length) return;
  if (q) $('q').value = q;
  Object.keys(more).forEach(k => { if (k === 'whole') $('whole').checked = true; else $(k).value = more[k]; });
  if (wk) { $('from').value = wk[0]; $('to').value = wk[1]; }
  if ($('app').hidden) { const sel = $('loadn'); if (sel.options.length) sel.selectedIndex = 0; $('loadbtn').click(); } else { page = 0; refresh(); }
};
window.ExploreInit = (() => { let d; return () => d || (d = (async () => {
  try {
    let r = await fetch('data/manifest.json'), base = 'data/'; if (!r.ok) r = await fetch('sample/manifest.json');
    const mf = await r.json(), ch = mf.chunks || mf.files || [], sel = $('loadn'); let rows = 0, by = 0; const opts = [];
    let best = 0, cb = 0; ch.forEach((c, i) => { cb += c.bytes || 0; if (cb <= 25 * 1048576) best = i + 1; });
    const marks = new Set([Math.min(3, ch.length), Math.min(10, ch.length), best || Math.min(3, ch.length), ch.length]);
    ch.forEach((c, i) => { rows += c.rows || 0; by += c.bytes || 0; if (marks.has(i + 1)) opts.push([i + 1, rows, by]); });
    sel.innerHTML = opts.map(([n, r2, b], i) => `<option value="${n}"${n === (best || opts[0][0]) ? ' selected' : ''}>${i === opts.length - 1 ? 'Everything' : 'Newest ' + n + ' files'}: ${r2 ? r2.toLocaleString() + ' items' : n + ' files'}${b ? ', ~' + (b < 1048576 ? Math.max(1, Math.round(b / 1024)) + ' KB' : Math.round(b / 1048576) + ' MB') : ''}</option>`).join('');
  } catch (e) { }
})()); })();
