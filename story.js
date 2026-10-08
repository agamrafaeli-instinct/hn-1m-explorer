'use strict';
(function () {
  const $ = id => document.getElementById(id);
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const fmtS = n => n >= 1e9 ? (n / 1e9).toFixed(1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'k' : String(Math.round(n));
  const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dlabel = t => { const d = new Date(t * 1000); return MN[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear(); };
  const pct = (x, d) => { const v = 100 * x; return (d != null ? v.toFixed(d) : v >= 10 ? v.toFixed(0) : v >= 1 ? v.toFixed(1) : v.toFixed(2)) + '%'; };
  const fpct = f => { const v = f * 100; return (v >= 1 ? +v.toFixed(1) : +v.toPrecision(2)) + '%'; };
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a || {}) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  async function getJSON(p) { const r = await fetch(p, { cache: 'no-cache' }); if (!r.ok) throw 0; return r.json(); }

  // y (cumulative share) at x (fraction of entities) by log-x interpolation on a lorenz [[x,y],...] list
  function at(L, x) {
    if (x <= L[0][0]) return L[0][1] * x / L[0][0];
    for (let i = 1; i < L.length; i++) if (x <= L[i][0]) {
      const a = L[i - 1], b = L[i], t = (Math.log(x) - Math.log(a[0])) / (Math.log(b[0]) - Math.log(a[0]) || 1); return a[1] + (b[1] - a[1]) * t;
    }
    return 1;
  }
  async function init() {
    let S, sample = false;
    try { S = await getJSON('data/summary.json'); } catch (e) { S = await getJSON('sample/summary.json'); sample = true; }
    if (sample || S.sample) $('banner').hidden = false;
    const C = S.concentration;
    const total = (S.totals && (S.totals.posts || S.totals.rows)) || (C && C.totals.posts) || 0;
    const tr = S.time_range || {};
    $('dek').innerHTML = `Every story in the latest ${fmt(total)} Hacker News items${tr.min ? ', from <b>' + dlabel(tr.min) + '</b> to <b>' + dlabel(tr.max) + '</b>' : ''}, asked one question through every lens: <b>where does the weight pile up?</b>`;
    if (C && C.posts.scored_posts) $('foot_note').innerHTML = `${pct(((S.type_counts || {}).comment || (total - C.posts.scored_posts)) / total, 0)} of items are comments, which carry no points, so point and comment lenses use the ${fmt(C.posts.scored_posts)} scored stories. Snapshot: ${S.generated_at ? S.generated_at.slice(0, 10) : 'recent'}; the newest stories may not have collected their final scores yet. All times are UTC.`;
    $('bigcount').textContent = fmt(total);
    getJSON((sample ? 'sample/' : 'data/') + 'manifest.json').then(m => { const b = (m.chunks || m.files || []).reduce((a, c) => a + (c.bytes || 0), 0); $('mb').textContent = b ? Math.round(b / 1048576) + ' MB' : 'a few MB'; }).catch(() => { $('mb').textContent = 'a few MB'; });
    hall(S.top_posts || []);
    ptsStep(S);
    if (!C) { $('intro').textContent = 'The concentration data has not been published yet.'; observe(); return; }
    const P = C.posts, E = C.entities, T = C.totals;
    $('intro').innerHTML = `Attention online is never spread evenly. On Hacker News, the top <b>1%</b> of stories hold <b>${pct(P.top_share_points['0.01'])}</b> of all points, and <b>${pct(P.zero_comment_share, 0)}</b> of stories get no comment at all. This page measures that pile-up for authors, domains, words, the clock and the calendar.`;
    lorenzScrolly('s_lz', 'svg_lz', P.lorenz_points, 'cap_lz', 'stories', 'points');
    lenses(C);
    ent('bars_auth', 'lede_auth', E.author, 'author', 'authors', T);
    ent('bars_dom', 'lede_dom', E.domain, 'domain', 'domains', T);
    ent('bars_word', 'lede_word', E.word, 'word', 'words', T);
    clock(C.cyclic, T); heat(C.cyclic.hourweek);
    idx('idx_wd', C.cyclic.weekday, WD, T); idx('idx_mo', C.cyclic.month, MN, T);
    calLede(C.cyclic, T);
    types(C.type, T);
    observe();
  }
  function ptsStep(S) {
    const sec = $('s_pts'); sec.style.height = (+sec.dataset.tall) + 'vh';
    const cm = (S.type_counts || {}).comment, tot = (S.totals && S.totals.posts) || S.total_rows || 0;
    const steps = [
      'Someone posts a story. Readers vote it up, and its <b>points</b> are the score Hacker News shows next to it.',
      'HN ranks a story by dividing its points by a power of the time since it was submitted. Points have to keep arriving to hold a spot.',
      'Comments have no score in HN&rsquo;s data' + (cm && tot ? ', and they make up <b>' + pct(cm / tot, 0) + '</b> of the items here' : '') + '. So every points number below is <b>story points</b>.'
    ];
    $('src_pts').innerHTML = 'Sources: <a href="https://news.ycombinator.com/newsfaq.html" target="_blank" rel="noopener">HN FAQ</a>, <a href="https://github.com/HackerNews/API" target="_blank" rel="noopener">HN API docs</a>. The card above is an illustration, not a real post.';
    let last = -1;
    function upd() {
      const r = sec.getBoundingClientRect(), p = clamp(-r.top / (r.height - innerHeight), 0, 1), e = 1 - Math.pow(1 - p, 2);
      $('pts_n').textContent = Math.round(1 + 149 * e); { const hh = Math.round(p * 10); $('pts_t').textContent = hh + (hh === 1 ? ' hour' : ' hours'); }
      $('pts_card').firstElementChild.style.transform = 'translateY(' + (-4 * Math.sin(p * 40)) + 'px)';
      const k = p < 0.34 ? 0 : p < 0.68 ? 1 : 2; if (k !== last) { last = k; $('cap_pts').innerHTML = steps[k]; }
    }
    upd(); addEventListener('scroll', upd, { passive: true });
  }
  function countUp(node, to) { const t0 = performance.now(); (function f(t) { const p = Math.min(1, (t - t0) / 1600); node.textContent = fmt(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(t0); }

  // ---- Scroll-drawn Lorenz curve on a log x axis
  function lorenzScrolly(secId, svgId, L, capId, noun, what) {
    const sec = $(secId), svg = $(svgId), cap = $(capId); sec.style.height = (+sec.dataset.tall) + 'vh';
    const x0 = Math.pow(10, Math.floor(Math.log10(L[0][0]))), lx0 = Math.log10(x0);
    const marks = [0.001, 0.01, 0.1].filter(m => m > L[0][0] * 0.999);
    let G, W, H;
    function build() {
      const r = svg.getBoundingClientRect(); W = r.width; H = r.height; if (!W) return; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = '';
      const Lm = 40, B = 46, T = 14, R = 14, iw = W - Lm - R, ih = H - B - T;
      const X = x => Lm + iw * (Math.log10(x) - lx0) / (0 - lx0), Y = y => T + ih * (1 - y);
      const ax = el('g', { class: 'ax' }, svg);
      for (let k = 0; k <= 4; k++) { const y = Y(k / 4); el('line', { x1: Lm, x2: W - R, y1: y, y2: y }, ax); el('text', { x: Lm - 6, y: y + 4, 'text-anchor': 'end' }, ax).textContent = (k * 25) + '%'; }
      const stepE = W < 520 ? 2 : 1; for (let e = 0; e >= lx0; e -= stepE) { const x = X(Math.pow(10, e)); el('line', { x1: x, x2: x, y1: T, y2: T + ih }, ax); el('text', { x, y: H - 10, 'text-anchor': 'middle' }, ax).textContent = fpct(Math.pow(10, e)); }
      el('text', { x: Lm + iw / 2, y: H - 2, 'text-anchor': 'middle' }, ax).textContent = 'top share of ' + noun + ' (log scale)';
      const eq = el('path', { d: `M${X(x0)} ${Y(x0)}L${X(1)} ${Y(1)}`, fill: 'none', stroke: '#8a7f73', 'stroke-dasharray': '4 4', opacity: .6 }, svg);
      const eqT = el('text', { x: X(0.6), y: Y(0.5) + 16, fill: '#8a7f73', 'font-size': 11, 'text-anchor': 'end' }, svg); eqT.textContent = 'equal split';
      const pts = L.map(p => [X(p[0]), Y(p[1])]);
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
      const defs = el('defs', {}, svg), cl = el('clipPath', { id: 'cp_' + svgId }, defs), cr = el('rect', { x: 0, y: 0, width: 0, height: H }, cl);
      el('path', { class: 'area', d: d + `L${pts[pts.length - 1][0]} ${Y(0)}L${pts[0][0]} ${Y(0)}Z`, style: 'fill:#ff6600;opacity:.18', 'clip-path': `url(#cp_${svgId})` }, svg);
      el('path', { class: 'ln', d, 'clip-path': `url(#cp_${svgId})` }, svg);
      const mk = marks.map(m => { const g = el('g', { style: 'opacity:0;transition:opacity .4s' }, svg); const y = at(L, m); el('circle', { cx: X(m), cy: Y(y), r: 5, fill: '#ff6600', stroke: '#fff', 'stroke-width': 2 }, g); const left = X(m) > W - 120; const t = el('text', { x: X(m) + (left ? -9 : 9), y: Y(y) + (left ? 16 : 4), 'text-anchor': left ? 'end' : 'start', 'font-size': 12, 'font-weight': 700, fill: '#ff6600' }, g); t.textContent = fpct(m) + ' hold ' + pct(y, 0); return { m, g }; });
      const dot = el('circle', { class: 'dot', r: 6 }, svg);
      G = { X, Y, cr, mk, dot, Lm, iw };
      update();
    }
    function update() {
      if (!G) return; const r = sec.getBoundingClientRect(), span = r.height - innerHeight;
      const p = clamp(-r.top / span, 0, 1), u = clamp(p / 0.66, 0, 1), back = clamp((p - 0.72) / 0.22, 0, 1);
      const x = Math.pow(10, back > 0 ? -2 * back : lx0 * (1 - u)), y = at(L, x);
      G.cr.setAttribute('width', back > 0 ? W : G.X(x) + 1); G.dot.setAttribute('cx', G.X(x)); G.dot.setAttribute('cy', G.Y(y));
      G.mk.forEach(o => o.g.style.opacity = x >= o.m * 0.999 ? 1 : 0);
      cap.innerHTML = back >= 1 ? `The top <b>1%</b> of ${noun} hold <b>${pct(at(L, 0.01), 0)}</b> of all ${what}. The top 10% hold <b>${pct(at(L, 0.1), 0)}</b>.` : p < 0.05 ? 'Scroll. Stories are ranked from most to least ' + what + '.' : `The top <b>${fpct(x)}</b> of ${noun} hold <b>${pct(y, y > .99 ? 1 : 0)}</b> of all ${what}.`;
    }
    build(); let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 150); });
    addEventListener('scroll', update, { passive: true });
  }

  // ---- Small multiples
  function mini(L, L2, W, H) {
    const lx0 = Math.log10(Math.pow(10, Math.floor(Math.log10(L[0][0])))), X = x => 14 + (W - 28) * (Math.log10(x) - lx0) / (0 - lx0), Y = y => 6 + (H - 18) * (1 - y);
    const path = L => L.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('');
    let s = `<path class="eq" d="M${X(Math.pow(10, lx0))} ${Y(Math.pow(10, lx0))}L${X(1)} ${Y(1)}"/>`;
    s += `<path class="lz" pathLength="1" d="${path(L)}"/>`;
    if (L2) s += `<path class="lz2" pathLength="1" d="${path(L2)}"/>`;
    s += `<text x="6" y="${H - 2}">${fpct(Math.pow(10, lx0))}</text><text x="${W - 6}" y="${H - 2}" text-anchor="end">100%</text>`;
    return s;
  }
  function lenses(C) {
    const E = C.entities, cards = [];
    [['author', 'Authors', 'authors'], ['domain', 'Domains', 'domains'], ['word', 'Title words', 'words']].forEach(([k, name, pl]) => {
      const e = E[k], y1 = at(e.lorenz_points, 0.01), y10 = at(e.lorenz_points, 0.1);
      cards.push({ name, big: pct(y1, 0), line: `of all points sit with the top <b>1%</b> of ${pl}. The top 10% hold ${pct(y10, 0)}.`, sub: `${fmt(e.count)} ${pl} · gini ${e.gini_points.toFixed(2)}`, L: e.lorenz_points });
    });
    const P = C.posts;
    cards.push({ name: 'Single stories', big: pct(P.top_share_points['0.01'], 0), line: `of points sit with the top <b>1%</b> of stories. Comments (dark line) are ${pct(P.top_share_comments['0.01'], 0)}.`, sub: `${pct(P.zero_comment_share, 0)} of stories have no comments`, L: P.lorenz_points, L2: P.lorenz_comments });
    $('mgrid').innerHTML = cards.map(c => `<div class="mc"><h3>${c.name}</h3><div class="big">${c.big}</div><div class="sm">${c.line}</div><svg viewBox="0 0 300 150" preserveAspectRatio="none">${mini(c.L, c.L2, 300, 150)}</svg><div class="sm" style="margin-top:6px">${c.sub}</div></div>`).join('');
    $('lede_lens').innerHTML = `Rank everything in a lens from heaviest to lightest, then ask how much of the total the top slice holds. The curve hugging the top-left means the weight is concentrated. <b>Gini</b> is the single-number version (0 = equal, 1 = one entity holds everything).`;
    document.querySelectorAll('.mc .lz,.mc .lz2').forEach(p => { p.style.strokeDasharray = 1; p.style.strokeDashoffset = 1; p.style.transition = 'stroke-dashoffset .9s ease'; });
  }

  // ---- Entity bars with share of total points
  function ent(id, ledeId, e, kind, pl, T) {
    const rows = e.top.filter(r => r.name).slice(0, 15), box = $(id); if (!rows.length) return;
    const max = rows[0].points, top10 = e.top.slice(0, 10).reduce((a, r) => a + r.points, 0);
    box.innerHTML = rows.map(r => `<div class="br"><div class="nm" title="${esc(r.name)}">${esc(r.name)}</div><div class="tr"><div class="fl" data-w="${(70 * r.points / max).toFixed(1)}"></div><span class="vl">${fmtS(r.points)} · ${pct(r.points / T.points)}</span></div></div>`).join('');
    const r0 = rows[0];
    $(ledeId).innerHTML = `<b>${esc(r0.name)}</b> alone holds <b>${pct(r0.points / T.points)}</b> of all points. The top 10 ${pl} hold <b>${pct(top10 / T.points)}</b>, out of ${fmt(e.count)}. Bars show points; labels show share of the whole.`;
  }

  // ---- Clock
  function clock(cy, T) {
    const H = cy.hour, tp = H.reduce((a, h) => a + h.points, 0), tq = H.reduce((a, h) => a + h.posts, 0), svg = $('svg_clock'); svg.innerHTML = '';
    const cx = 200, cyy = 200, r0 = 50, rmax = 170, mx = Math.max(...H.map(h => h.points / tp), ...H.map(h => h.posts / tq));
    const arc = (i, r1, r2, pad) => { const a0 = (i / 24) * 2 * Math.PI - Math.PI / 2 + pad, a1 = ((i + 1) / 24) * 2 * Math.PI - Math.PI / 2 - pad; const p = (r, a) => [cx + r * Math.cos(a), cyy + r * Math.sin(a)]; const A = p(r1, a0), B = p(r1, a1), C = p(r2, a1), D = p(r2, a0); return `M${A}L${D}A${r2} ${r2} 0 0 1 ${C}L${B}A${r1} ${r1} 0 0 0 ${A}Z`; };
    for (let i = 0; i < 24; i++) { el('text', { x: cx + (rmax + 14) * Math.cos((i + .5) / 24 * 2 * Math.PI - Math.PI / 2), y: cyy + (rmax + 14) * Math.sin((i + .5) / 24 * 2 * Math.PI - Math.PI / 2) + 3, 'text-anchor': 'middle', fill: '#a99d8f', 'font-size': 10 }, svg).textContent = i % 3 === 0 ? i : ''; }
    el('circle', { cx, cy: cyy, r: r0 - 2, fill: 'none', stroke: '#3a322b' }, svg);
    const A = [], B = [];
    H.forEach((h, i) => { A.push(el('path', { fill: '#ff6600', opacity: .9 }, svg)); B.push(el('path', { fill: '#f4ece2', opacity: .95 }, svg)); });
    // center of gravity: circular mean of points over the 24h clock
    let sx = 0, sy = 0; H.forEach((h, i) => { const a = (i + .5) / 24 * 2 * Math.PI; sx += h.points * Math.cos(a); sy += h.points * Math.sin(a); });
    let ang = Math.atan2(sy, sx); if (ang < 0) ang += 2 * Math.PI; const cog = ang / (2 * Math.PI) * 24, hh = Math.floor(cog), mm = Math.round((cog - hh) * 60);
    const needle = el('line', { x1: cx, y1: cyy, x2: cx + (rmax + 6) * Math.sin(0), y2: cyy, stroke: '#ffd9bf', 'stroke-width': 2, 'stroke-dasharray': '3 3', opacity: 0 }, svg);
    const ta = ang - Math.PI / 2; needle.setAttribute('x2', cx + (rmax + 6) * Math.cos(ta)); needle.setAttribute('y2', cyy + (rmax + 6) * Math.sin(ta));
    el('text', { x: cx, y: cyy - 4, 'text-anchor': 'middle', fill: '#f4ece2', 'font-size': 20, 'font-weight': 800, 'font-family': 'Fraunces,serif' }, svg).textContent = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
    el('text', { x: cx, y: cyy + 14, 'text-anchor': 'middle', fill: '#a99d8f', 'font-size': 10 }, svg).textContent = 'UTC';
    svg._anim = () => { const t0 = performance.now(); (function f(t) { const p = clamp((t - t0) / 800, 0, 1), e = 1 - Math.pow(1 - p, 3); H.forEach((h, i) => { A[i].setAttribute('d', arc(i, r0, r0 + (rmax - r0) * e * (h.points / tp) / mx, .012)); B[i].setAttribute('d', arc(i, r0, r0 + (rmax - r0) * e * (h.posts / tq) / mx * 0.999, .06)); }); needle.setAttribute('opacity', e); if (p < 1) requestAnimationFrame(f); })(t0); };
    const top3 = H.map((h, i) => [h.points / tp, i]).sort((a, b) => b[0] - a[0]).slice(0, 3), sh = top3.reduce((a, b) => a + b[0], 0), eff = H.map((h, i) => [h.points / h.posts, i]).sort((a, b) => b[0] - a[0])[0];
    $('lede_clock').innerHTML = `The attention-weighted center of the day is <b>${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} UTC</b>. Three hours (<b>${top3.map(x => String(x[1]).padStart(2, '0') + ':00').join(', ')}</b>) carry <b>${pct(sh, 0)}</b> of all points, against 12.5% if the day were flat. Items submitted around <b>${String(eff[1]).padStart(2, '0')}:00</b> earn the most points each on average.`;
  }
  function heat(hw) {
    if (!hw) return; const box = $('heat'), mx = Math.max(...hw.flat()); let s = '<span></span>' + Array.from({ length: 24 }, (_, h) => `<span class="l" style="justify-content:center">${h % 6 === 0 ? h : ''}</span>`).join('');
    hw.forEach((row, d) => { s += `<span class="l">${WD[d]}</span>` + row.map((v, h) => `<i class="c" data-o="${(0.08 + 0.92 * Math.sqrt(v / mx)).toFixed(2)}" title="${WD[d]} ${h}:00 UTC · ${fmt(v)} points"></i>`).join(''); });
    box.innerHTML = s;
    box.insertAdjacentHTML('afterend', '<div class="hlegend"><span>fewer points</span><i></i><span>more points</span></div><p class="src" style="color:#a99d8f">All times UTC.</p>');
  }
  // ---- Index bars: points per post vs the overall average
  function idx(id, arr0, names0, T) {
    const keep = arr0.map((a, i) => i).filter(i => arr0[i].posts > 0), arr = keep.map(i => arr0[i]), names = keep.map(i => names0[i]);
    const avg = T.points / T.posts, vals = arr.map(a => a.posts ? (a.points / a.posts) / avg : 1), mx = Math.max(1.05, ...vals.map(v => Math.abs(v - 1) + 1)) , span = Math.max(...vals.map(v => Math.abs(v - 1)), 0.05) * 1.15;
    $(id).innerHTML = arr.map((a, i) => { const d0 = vals[i] - 1, d = Math.abs(d0) < 0.005 ? 0 : d0, w = d === 0 ? 0.6 : 50 * Math.abs(d) / span; return `<div class="br"><div class="nm">${names[i]}</div><div class="tr"><div class="fl" data-l="${d >= 0 ? 50 : 50 - w}" data-w="${w}" style="background:${d === 0 ? '#8a7f73' : d > 0 ? '#ff6600' : '#8a7f73'};left:50%"></div><span class="vl">${vals[i].toFixed(2)}x</span></div></div>`; }).join('');
    $(id).dataset.idx = 1;
  }
  function calLede(cy, T) {
    const avg = T.points / T.posts, wd = cy.weekday.map((a, i) => [(a.points / a.posts) / avg, i]).sort((a, b) => b[0] - a[0]), mo = cy.month.map((a, i) => [a.posts ? (a.points / a.posts) / avg : 0, i]).filter(x => x[0]).sort((a, b) => b[0] - a[0]);
    const wk = cy.weekday.reduce((a, b) => a + b.posts, 0), we = cy.weekday[5].posts + cy.weekday[6].posts;
    $('lede_cal').innerHTML = `How much an item earns depends on when it lands. <b>${WD[wd[0][1]]}</b> items earn ${wd[0][0].toFixed(2)}x the average points, <b>${WD[wd[wd.length - 1][1]]}</b> only ${wd[wd.length - 1][0].toFixed(2)}x. Weekends hold ${pct(we / wk, 0)} of items. The best month is <b>${MN[mo[0][1]]}</b> (${mo[0][0].toFixed(2)}x); the weakest is <b>${MN[mo[mo.length - 1][1]]}</b> (${mo[mo.length - 1][0].toFixed(2)}x).`;
  }
  function types(ty, T) {
    const rows = Object.entries(ty).sort((a, b) => b[1].posts - a[1].posts), box = $('bars_type');
    box.innerHTML = rows.map(([k, v]) => `<div class="br"><div class="nm">${esc(k)}</div><div style="display:flex;flex-direction:column;gap:3px">${[['posts', v.posts / T.posts, '#ff6600'], ['points', v.points / T.points, '#1b1814'], ['comments', v.comments / T.comments, '#8a7f73']].map(([n, s, c]) => `<div class="tr" style="height:16px"><div class="fl" data-w="${(52 * s).toFixed(1)}" style="background:${c}"></div><span class="vl" style="font-size:11px">${n} ${pct(s)}</span></div>`).join('')}</div></div>`).join('');
    const top = rows[0];
    $('lede_type').innerHTML = `Each type's share of posts (orange), points (black) and comments (grey). <b>${esc(top[0])}</b> makes up ${pct(top[1].posts / T.posts, 0)} of the items and ${pct(top[1].points / T.points, 0)} of the points.`;
  }
  function hall(posts) {
    $('hall').innerHTML = posts.slice(0, 10).map(p => { const hn = 'https://news.ycombinator.com/item?id=' + p.id, link = (p.url || hn).replace(/\/{2,}$/, '/'); return `<li><a href="${esc(link)}" target="_blank" rel="noopener">${esc(p.title || '(untitled)')}</a><div class="m">${fmt(p.score || 0)} points · ${fmt(p.descendants || 0)} comments · by ${esc(p.by)}${p.time ? ' · ' + dlabel(p.time) : ''} · <a href="${hn}" target="_blank" rel="noopener">discuss</a></div></li>`; }).join('');
  }
  function observe() {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; const t = e.target;
      if (t.classList.contains('barlist')) t.querySelectorAll('.fl').forEach((f, i) => setTimeout(() => { if (f.dataset.l != null) f.style.left = f.dataset.l + '%'; f.style.width = f.dataset.w + '%'; }, i * 25));
      if (t.id === 'hall') t.querySelectorAll('li').forEach((li, i) => setTimeout(() => li.classList.add('in'), i * 40));
      if (t.id === 'mgrid') t.querySelectorAll('.lz,.lz2').forEach((p, i) => setTimeout(() => p.style.strokeDashoffset = 0, i * 60));
      if (t.id === 'svg_clock' && t._anim) t._anim();
      if (t.id === 'heat') t.querySelectorAll('.c').forEach((c, i) => setTimeout(() => c.style.opacity = c.dataset.o, (i % 24) * 6 + Math.floor(i / 24) * 12));
      io.unobserve(t);
    }), { threshold: 0.01, rootMargin: '0px 0px 20% 0px' });
    document.querySelectorAll('.barlist,#hall,#mgrid,#svg_clock,#heat').forEach(x => io.observe(x));
  }
  addEventListener('scroll', () => { const h = document.documentElement; $('progress').firstElementChild.style.width = (100 * scrollY / (h.scrollHeight - innerHeight)) + '%'; }, { passive: true });
  init().catch(e => { $('dek').textContent = 'Could not load data: ' + e; console.error(e); });
})();
