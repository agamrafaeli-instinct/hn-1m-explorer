'use strict';
(function () {
  const $ = id => document.getElementById(id);
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const fmtS = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'k' : String(Math.round(n));
  const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mlabel = m => { const [y, mo] = m.split('-'); return MN[+mo - 1] + ' ' + y; };
  const dlabel = t => { const d = new Date(t * 1000); return MN[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear(); };
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a || {}) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  async function getJSON(p) { const r = await fetch(p, { cache: 'no-cache' }); if (!r.ok) throw 0; return r.json(); }
  async function init() {
    let S, sample = false;
    try { S = await getJSON('data/summary.json'); } catch (e) { S = await getJSON('sample/summary.json'); sample = true; }
    if (sample || S.sample) $('banner').hidden = false;
    let mo = (S.monthly || []).filter(m => m.month).sort((a, b) => a.month < b.month ? -1 : 1);
    if (mo.length > 6) { const prev = mo.slice(-4, -1).map(m => m.posts).sort((a, b) => a - b)[1]; if (mo[mo.length - 1].posts < 0.6 * prev) mo = mo.slice(0, -1); }
    const total = (S.totals && (S.totals.posts || S.totals.rows || S.totals.total_rows)) || S.total_rows || mo.reduce((a, m) => a + m.posts, 0);
    const tr = S.time_range || {};
    $('d0').textContent = tr.min ? dlabel(tr.min) : mlabel(mo[0].month);
    $('d1').textContent = tr.max ? dlabel(tr.max) : mlabel(mo[mo.length - 1].month);
    countUp($('bigcount'), total);
    document.getElementById('dek').innerHTML = `Every story, job and poll in the latest ${fmt(total)} items, from <b>${$('d0').textContent}</b> to <b>${$('d1').textContent}</b>. Scroll.`;
    const types = S.type_counts || {};
    const tt = Object.entries(types).sort((a, b) => b[1] - a[1]);
    const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
    $('intro').innerHTML = tt.length
      ? `That is <b>${fmt(total)} items</b>, and <b>${pct(tt[0][1], total)}%</b> of them are ${esc(tt[0][0])}s. Here is how they stack up over time, who posts them, and what they link to.`
      : `That is <b>${fmt(total)} items</b>. Here is how they stack up over time, who posts them, and what they link to.`;
    scrolly('s_posts', 'svg_posts', mo, m => m.posts, 'cap_posts', (m, i, best) => `<b>${mlabel(m.month)}</b>: ${fmt(m.posts)} posts`, v => fmtS(v), 'posts');
    const avg = mo.map(m => Object.assign({}, m, { avg: m.posts ? m.score_sum / m.posts : 0 }));
    scrolly('s_score', 'svg_score', avg, m => m.avg, 'cap_score', m => `<b>${mlabel(m.month)}</b>: an average post scored ${m.avg.toFixed(1)}`, v => v.toFixed(0), 'avg');
    bars('bars_dom', (S.top_domains || []).filter(d => d.domain).slice(0, 15).map(d => [d.domain, d.posts]), 'lede_dom', 'domain');
    bars('bars_auth', (S.top_authors || []).slice(0, 15).map(d => [d.by, d.posts]), 'lede_auth', 'author');
    hall(S.top_posts || []);
    $('mb').textContent = '...';
    getJSON((sample ? 'sample/' : 'data/') + 'manifest.json').then(m => {
      const b = (m.chunks || m.files || []).reduce((a, c) => a + (c.bytes || 0), 0);
      $('mb').textContent = b ? Math.round(b / 1048576) + ' MB' : 'a few MB';
    }).catch(() => { $('mb').textContent = 'a few MB'; });
    observe();
  }
  function countUp(node, to) {
    const t0 = performance.now(), dur = 1600;
    (function f(t) { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); node.textContent = fmt(to * e); if (p < 1) requestAnimationFrame(f); })(t0);
  }
  // Scroll-driven line chart: the line draws as you scroll the tall section.
  function scrolly(secId, svgId, data, acc, capId, capFn, yfmt, key) {
    const sec = $(secId), svg = $(svgId), cap = $(capId);
    sec.style.height = (+sec.dataset.tall) + 'vh';
    const vals = data.map(acc), n = vals.length, rawMax = Math.max(...vals) * 1.05 || 1;
    const mag = Math.pow(10, Math.floor(Math.log10(rawMax))), nice = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(k => k * mag >= rawMax) * mag, max = nice;
    const bi = vals.indexOf(Math.max(...vals)), li = n - 1;
    let W = 0, H = 0, g, path, areaP, dot, tip, tipT, tipR;
    function build() {
      const r = svg.getBoundingClientRect(); W = r.width; H = r.height; if (!W) return;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = '';
      const L = 38, B = 22, T = 14, R = 8, iw = W - L - R, ih = H - B - T;
      const X = i => L + iw * (n > 1 ? i / (n - 1) : 0), Y = v => T + ih * (1 - v / max);
      const defs = el('defs', {}, svg), lg = el('linearGradient', { id: 'g1_' + svgId, x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
      el('stop', { offset: 0, 'stop-color': '#ff6600' }, lg); el('stop', { offset: 1, 'stop-color': '#ff6600', 'stop-opacity': 0 }, lg);
      const ax = el('g', { class: 'ax' }, svg);
      for (let k = 0; k <= 4; k++) { const v = max * k / 4 / 1.0, y = Y(v); el('line', { x1: L, x2: W - R, y1: y, y2: y }, ax); const t = el('text', { x: L - 6, y: y + 4, 'text-anchor': 'end' }, ax); t.textContent = yfmt(v); }
      const yrs = []; data.forEach((m, i) => { if (m.month.endsWith('-01') || i === 0) yrs.push([i, m.month.slice(0, 4)]); });
      const step = Math.ceil(yrs.length / (W < 500 ? 4 : 9));
      yrs.forEach(([i, y], k) => { if (i === 0 && yrs.length > 1 && yrs[1][0] < 8) return; if (k % step === 0) { const t = el('text', { x: X(i), y: H - 4, 'text-anchor': 'middle' }, ax); t.textContent = y; } });
      const pts = vals.map((v, i) => [X(i), Y(v)]);
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
      areaP = el('path', { class: 'area', d: d + `L${pts[n - 1][0]} ${Y(0)}L${pts[0][0]} ${Y(0)}Z`, fill: `url(#g1_${svgId})`, style: 'fill:url(#g1_' + svgId + ')' }, svg);
      path = el('path', { class: 'ln', d }, svg);
      path.len = path.getTotalLength(); path.setAttribute('stroke-dasharray', path.len);
      const clip = el('clipPath', { id: 'cp_' + svgId }, defs); clip.rect = el('rect', { x: 0, y: 0, width: 0, height: H }, clip);
      areaP.setAttribute('clip-path', `url(#cp_${svgId})`);
      dot = el('circle', { class: 'dot', r: 6 }, svg);
      tip = el('g', { class: 'tip' }, svg); tipR = el('rect', { rx: 5, height: 22 }, tip); tipT = el('text', { y: 15, x: 8 }, tip);
      g = { pts, L, R, iw, T, ih, clip };
      update(true);
    }
    let last = -1;
    function update(force) {
      if (!g) return;
      const r = sec.getBoundingClientRect(), span = r.height - innerHeight;
      const p = Math.max(0, Math.min(1, -r.top / span)), pe = Math.min(1, p / 0.85);
      const f = pe * (n - 1), i = Math.round(f);
      path.setAttribute('stroke-dashoffset', path.len * (1 - pe));
      g.clip.rect.setAttribute('width', g.L + g.iw * pe + 1);
      const pi = g.pts[Math.min(n - 1, i)], x0 = g.pts[Math.floor(f)], x1 = g.pts[Math.min(n - 1, Math.ceil(f))];
      const fr = f - Math.floor(f), px = x0[0] + (x1[0] - x0[0]) * fr, py = x0[1] + (x1[1] - x0[1]) * fr;
      dot.setAttribute('cx', px); dot.setAttribute('cy', py);
      const txt = capFn(data[Math.min(n - 1, i)], i).replace(/<[^>]+>/g, '');
      tipT.textContent = txt; const w = txt.length * 6.6 + 16; tipR.setAttribute('width', w);
      let tx = Math.min(Math.max(px - w / 2, 0), W - w), ty = Math.max(py - 36, 0);
      tip.setAttribute('transform', `translate(${tx},${ty})`);
      if (i !== last || force) {
        last = i;
        let note = '';
        if (p < 0.08) note = 'Scroll to draw the line.';
        else if (p >= 0.97) note = key === 'posts'
          ? `Busiest month: <b>${mlabel(data[bi].month)}</b> with ${fmt(vals[bi])} posts. Latest: ${fmt(vals[li])}.`
          : `Best month for attention: <b>${mlabel(data[bi].month)}</b> at ${vals[bi].toFixed(1)} points per post.`;
        else note = capFn(data[Math.min(n - 1, i)], i);
        cap.innerHTML = note;
      }
    }
    build();
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 150); });
    addEventListener('scroll', () => update(), { passive: true });
  }
  function bars(id, rows, ledeId, kind) {
    const box = $(id); if (!rows.length) return;
    const max = rows[0][1], tot = rows.reduce((a, r) => a + r[1], 0);
    box.innerHTML = rows.map(r => `<div class="br"><div class="nm">${esc(r[0])}</div><div class="tr"><div class="fl" data-w="${(100 * r[1] / max).toFixed(1)}"></div><span class="vl">${fmt(r[1])}</span></div></div>`).join('');
    $(ledeId).innerHTML = kind === 'domain'
      ? `<b>${esc(rows[0][0])}</b> leads with ${fmt(rows[0][1])} posts. The top ${rows.length} sites account for ${fmt(tot)} links.`
      : `<b>${esc(rows[0][0])}</b> has posted ${fmt(rows[0][1])} times. The ${rows.length} most active accounts posted ${fmt(tot)} items between them.`;
  }
  function hall(posts) {
    $('hall').innerHTML = posts.slice(0, 10).map(p => {
      const hn = 'https://news.ycombinator.com/item?id=' + p.id, link = p.url || hn;
      return `<li><a href="${esc(link)}" target="_blank" rel="noopener">${esc(p.title || '(untitled)')}</a><div class="m">${fmt(p.score || 0)} points · ${fmt(p.descendants || 0)} comments · by ${esc(p.by)}${p.time ? ' · ' + dlabel(p.time) : ''} · <a href="${hn}" target="_blank" rel="noopener">discuss</a></div></li>`;
    }).join('');
  }
  function observe() {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      if (e.target.classList.contains('barlist')) e.target.querySelectorAll('.fl').forEach((f, i) => setTimeout(() => f.style.width = f.dataset.w + '%', i * 70));
      if (e.target.tagName === 'OL') e.target.querySelectorAll('li').forEach((li, i) => setTimeout(() => li.classList.add('in'), i * 90));
      io.unobserve(e.target);
    }), { threshold: 0.15 });
    document.querySelectorAll('.barlist,#hall').forEach(x => io.observe(x));
  }
  addEventListener('scroll', () => { const h = document.documentElement; $('progress').firstElementChild.style.width = (100 * scrollY / (h.scrollHeight - innerHeight)) + '%'; }, { passive: true });
  init().catch(e => { $('dek').textContent = 'Could not load data: ' + e; });
})();
