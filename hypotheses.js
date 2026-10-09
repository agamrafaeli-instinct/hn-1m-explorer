'use strict';
// Renders hypothesis cards from hypotheses/*.json. Card text comes from PRs: only textContent, never innerHTML.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const sv = (tag, at, txt) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (txt != null) e.textContent = txt; return e; };
  const fmtN = (v, k) => k && k.display_pct ? (v * 100).toFixed(2) + '%' : v >= 100 ? Math.round(v).toLocaleString() : v.toFixed(v >= 10 ? 1 : 2);
  let TH = [];
  const fmt = v => v == null ? 'n/a' : (v >= 10 ? v.toFixed(1) : TH.some(t => Math.abs(v - t) < 0.0051 && v.toFixed(2) === t.toFixed(2)) ? v.toFixed(3) : v.toFixed(2));
  const LABEL = { supported: 'Supported', refuted: 'Refuted', inconclusive: 'Inconclusive' };

  function gauge(card, r) {
    TH = (card.verdicts || []).filter(x => x.when).map(x => x.when.value);
    const th = card.verdicts.filter(x => x.when).map(x => x.when.value), unit = card.check.unit || '';
    const max = Math.max(2, r.value * 1.15, Math.max.apply(null, th) * 1.2), W = 320, X = v => 12 + (v / max) * (W - 24);
    const s = sv('svg', { viewBox: '0 0 ' + W + ' 74', role: 'img', 'aria-label': 'Measured ' + fmt(r.value) + unit + ' against the verdict thresholds' });
    s.appendChild(sv('line', { x1: 12, x2: W - 12, y1: 36, y2: 36, class: 'g-track' }));
    let lastX = -99;
    [...new Set(th)].sort((a, b) => a - b).forEach(t => {
      s.appendChild(sv('line', { x1: X(t), x2: X(t), y1: 26, y2: 46, class: 'g-tick' }));
      if (X(t) - lastX < 34) return; lastX = X(t);
      s.appendChild(sv('text', { x: X(t), y: 62, 'text-anchor': 'middle', class: 'g-lab' }, (t >= 10 ? t.toFixed(1) : t.toFixed(2)) + unit));
    });
    s.appendChild(sv('circle', { cx: X(r.value), cy: 36, r: 9, class: 'g-dot' }));
    s.appendChild(sv('text', { x: Math.min(Math.max(X(r.value), 28), W - 28), y: 18, 'text-anchor': 'middle', class: 'g-val' }, fmt(r.value) + unit));
    return s;
  }
  function bars(card, r) {
    const n = r.series.length, W = 320, H = 110, bw = (W - 8) / n, lab = r.labels || [];
    const max = Math.max.apply(null, r.series.concat(r.split ? r.series_b : [])) || 1;
    const s = sv('svg', { viewBox: '0 0 ' + W + ' ' + (H + 16), role: 'img', 'aria-label': 'Values by row' });
    r.series.forEach((v, i) => {
      if (r.split) {
        [[v, 'b-a', 0], [r.series_b[i], 'b-b', 1]].forEach(([x, cls, k]) => {
          const h = Math.max(1, (x / max) * H); s.appendChild(sv('rect', { x: 4 + i * bw + bw * 0.08 + k * bw * 0.42, y: H - h, width: bw * 0.4, height: h, rx: 2, class: cls }));
        });
      } else {
        const h = Math.max(1, (v / max) * H), cls = r.ia.includes(i) ? 'b-a' : r.ib.includes(i) ? 'b-b' : 'b-x';
        s.appendChild(sv('rect', { x: 4 + i * bw + bw * 0.12, y: H - h, width: bw * 0.76, height: h, rx: 2, class: cls }));
      }
      if (n <= 12 && !(n > 8 && i % 2) || n > 12 && i % Math.ceil(n / 5) === 0) { const raw = String(lab[i] || i), tx = /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(5) : /^\d{4}-\d{2}/.test(raw) ? raw.slice(2) : raw.length > 8 ? raw.slice(0, 7) + '.' : raw, cx = 4 + i * bw + bw / 2, an = cx < 22 ? 'start' : cx > W - 22 ? 'end' : 'middle'; s.appendChild(sv('text', { x: an === 'start' ? 2 : an === 'end' ? W - 2 : cx, y: H + 12, 'text-anchor': an, class: 'g-lab' }, tx)); }
    });
    return s;
  }
  function strip(series, labels) { return bars(null, { series, labels, ia: series.map((_, i) => i), ib: [], split: false }); }
  const VERDICT = {
    supported: ['Supported', 'The data backs the guess.'],
    refuted: ['Refuted', 'The data points the other way. The guess was wrong, and it stays on the page.'],
    inconclusive: ['Inconclusive', 'The result fell between our lines, so we cannot call it either way.']
  };
  const CONF = { strong: 'Strong: it cleared the higher bar we set.', weak: 'Weak: it cleared only the lower bar we set.' };
  function step(a, kick, node) { const s = el('section', 'st'); s.appendChild(el('h4', '', kick)); (Array.isArray(node) ? node : [node]).forEach(n => s.appendChild(n)); a.appendChild(s); return s; }
  function render(card, r) {
    TH = (card.verdicts || []).filter(x => x.when).map(x => x.when.value);
    const k = card.check, split = r.split && !/^\d{4}-/.test(String((r.labels || [])[0] || ''));
    const la = split ? (k.legend_a || 'Matching stories') : k.group_a.label, lb = split ? (k.legend_b || 'Everything else') : k.group_b.label;
    const per = k.per_label || (k.path.endsWith('hour') ? 'per hour' : k.normalize ? 'per day' : 'average');
    const a = el('article', 'hyp narr ' + r.verdict);
    a.appendChild(el('p', 'hyp-id', card.id + (card.audience ? ' \u00b7 for ' + card.audience : '')));
    // 1. the guess
    a.appendChild(el('h3', '', card.title));
    step(a, 'The guess', el('p', 'hyp-q', card.hypothesis));
    // 2. why it might be true (only when the card author wrote it)
    if (card.why) step(a, 'Why it might be true', el('p', '', card.why));
    // 3. what we checked
    step(a, 'What we checked', el('p', '', 'We compared ' + la + ' with ' + lb + ' (' + per + ')' + (r.win ? '. Data window: ' + r.win + '.' : ' in the data window.')));
    // 4. what we saw
    const lg = el('p', 'hyp-lg'); lg.appendChild(el('span', 'sw a')); lg.appendChild(document.createTextNode(la)); lg.appendChild(el('span', 'sw b')); lg.appendChild(document.createTextNode(lb));
    step(a, 'What we saw', [bars(card, r), lg, el('p', 'take', la + ' came out at ' + fmtN(r.mean_a, k) + ', ' + lb + ' at ' + fmtN(r.mean_b, k) + '. That is a ratio of ' + fmt(r.value) + (k.unit || 'x') + '.')]);
    if (r.hist) {
      const h = r.hist, lg2 = el('p', 'hyp-lg'); lg2.appendChild(el('span', 'sw a')); lg2.appendChild(document.createTextNode(la)); lg2.appendChild(el('span', 'sw b')); lg2.appendChild(document.createTextNode(lb));
      const same = h.verdict === r.verdict, hv = VERDICT[h.verdict][0].toLowerCase();
      step(a, 'Across the whole archive', [bars(card, h), lg2, el('p', 'take', h.win + ': ' + la + ' ' + fmtN(h.mean_a, k) + ', ' + lb + ' ' + fmtN(h.mean_b, k) + ', ratio ' + fmt(h.value) + (k.unit || 'x') + '.'),
        (k.field === 'points' ? el('p', 'hnote diff', 'Caution: archive points per story shift level in Dec 2023 and Jan 2026 (about 2, then 12 to 16, then about 2), cause unknown. Treat this check as rough.') : document.createTextNode('')), el('p', 'hnote' + (same ? '' : ' diff'), same ? 'The same rules give the same call over the full archive.' : 'Different call: the same rules over the full archive would read ' + hv + ', not ' + VERDICT[r.verdict][0].toLowerCase() + '. The verdict below stays based on the newest window.')]);
    }
    if (r.strip) {
      step(a, 'Across the whole archive', [strip(r.strip.series, r.strip.labels), el('p', 'take', r.strip.name + ': share of stories matching "rust" each month, ' + r.strip.win + '. Zig and the other words in this card are not in the archive\'s term list, so this is not the same measure as the chart above.')]);
    }
    // 5. verdict in plain words
    const V = VERDICT[r.verdict], vb = el('div', 'verdict');
    vb.appendChild(el('b', '', V[0])); vb.appendChild(el('span', '', V[1] + (CONF[r.confidence] ? ' ' + CONF[r.confidence] : '')));
    step(a, 'Verdict', vb);
    // 6. folded: rules, gauge, caveats, source
    const d = el('details', 'more-d'); d.appendChild(el('summary', '', 'Caveats, the rules we set, source'));
    d.appendChild(gauge(card, r));
    const ex = el('p', 'hyp-ex'); ex.appendChild(el('b', '', 'Rules set in advance: ')); ex.appendChild(document.createTextNode(card.expect.replace(/^If true,\s*/i, ''))); d.appendChild(ex);
    if (card.caveats && card.caveats.length) { const bx = el('div', 'cav'); bx.appendChild(el('b', '', 'Caveats')); card.caveats.forEach(t => bx.appendChild(el('p', '', t))); d.appendChild(bx); }
    d.appendChild(el('p', 'src', 'Check: ' + k.source + ' \u203a ' + k.path + '.' + k.field + (card.author ? ' \u00b7 by ' + card.author : '')));
    a.appendChild(d); a.classList.add('compact');
    return a;
  }
  const get = u => fetch(u).then(r => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });
  let bundleP, tallyP, allP; const srcC = {};
  const source = s => srcC[s] || (srcC[s] = get(s));
  function bundle() {
    return bundleP || (bundleP = get('hypotheses/bundle.json').then(b => b.cards).catch(async () => {
      const names = await get('hypotheses/index.json');
      return Promise.all(names.map(n => get('hypotheses/' + n + '.json').then(card => ({ name: n, card }), e => ({ name: n, error: e.message }))));
    }));
  }
  const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dstr = d => MN[d.getUTCMonth()] + ' ' + d.getUTCDate() + ' ' + d.getUTCFullYear();
  const mon = iso => { const p = String(iso).split('-'); return MN[+p[1] - 1] + ' ' + p[0]; };
  function winText(card, data) {
    try {
      const p = card.check.path, rows = p.split('.').reduce((o, k) => o[k], data), l0 = rows[0] || {};
      const sec = x => new Date(x * 1000);
      if (data.window && data.window.start_utc) return 'newest items, ' + dstr(new Date(data.window.start_utc)) + ' to ' + dstr(new Date(Date.parse(data.window.end_exclusive_utc) - 1));
      if (l0.month || (l0.label === undefined && /monthly/.test(p))) return 'full archive, ' + mon(rows[0].month) + ' to ' + mon(rows[rows.length - 1].month);
      const wk = r => r.week || r.label; const f = wk(rows[0]), l = wk(rows[rows.length - 1]);
      if (/^\d{4}-\d{2}-\d{2}$/.test(f || '') && /^\d{4}-\d{2}-\d{2}$/.test(l || '')) return 'newest items, ' + dstr(new Date(f)) + ' to ' + dstr(new Date(Date.parse(l) + 6 * 864e5)) + ' (' + rows.length + ' weeks)';
      const tr = data.time_range || data.window; if (tr && tr.min) return 'newest ' + (data.total_rows ? data.total_rows.toLocaleString() + ' ' : '') + 'items, ' + dstr(sec(tr.min)) + ' to ' + dstr(sec(tr.max));
    } catch (e) { }
    return '';
  }
  async function evalOne(b) {
    if (b.error) return b;
    try {
      const src = b.card.check.source;
      if (!/^data\/[\w.-]+\.json$/.test(src)) throw new Error('source must be data/*.json');
      const data = await source(src), r = HypEval.evaluate(b.card, data);
      r.win = winText(b.card, data);
      try {
        if (b.card.check.path === 'concentration.cyclic.weekday') {
          const H = await source('data/history/strips.json'), w = H.weekday;
          const syn = { time_range: H.time_range, concentration: { cyclic: { weekday: [0, 1, 2, 3, 4, 5, 6].map(i => ({ posts: w.posts[i], points: w.points[i], comments: w.comments[i] })) } } };
          r.hist = HypEval.evaluate(b.card, syn); r.hist.win = 'Full archive, ' + mon(H.first) + ' to ' + mon(H.last);
        } else if (b.card.id === 'h009') {
          const H = await source('data/history/strips.json');
          r.strip = { labels: H.months, series: H.term_share.rust, name: 'Rust alone', win: 'Full archive, ' + mon(H.first) + ' to ' + mon(H.last) };
        }
      } catch (e) { }
      return { name: b.name, card: b.card, r };
    } catch (e) { return { name: b.name, error: e.message }; }
  }
  async function one(id) { const b = (await bundle()).find(x => x.name.startsWith(id + '-')); if (!b) throw new Error('not found'); const x = await evalOne(b); if (x.error) throw new Error(x.error); return x; }
  function all() { return allP || (allP = bundle().then(l => Promise.all(l.map(evalOne)))); }
  function tally() {
    return tallyP || (tallyP = get('hypotheses/tally.json').catch(async () => (await all()).map(x => x.error ? { name: x.name, error: x.error } : { name: x.name, audience: x.card.audience || null, title: x.card.title, verdict: x.r.verdict, confidence: x.r.confidence })));
  }
  function compact(card) {
    if (card.querySelector('.more-d')) return card;
    const keep = card.querySelectorAll('.hyp-ex, details.pts, .src'); if (!keep.length) return card;
    const d = document.createElement('details'); d.className = 'more-d'; const s = document.createElement('summary'); s.textContent = 'What we tested, caveats, source'; d.appendChild(s);
    keep.forEach(e => d.appendChild(e)); card.appendChild(d); card.classList.add('compact'); return card;
  }
  window.HypCards = { all, one, tally, bundle, render, compact, initList, strip, source };
  let listed;
  async function initList() {
    if (listed) return; listed = true;
    const host = document.getElementById('hyp_list'); if (!host) return;
    try {
      const bl = (await bundle()).filter(b => b.error || !b.card.audience);
      const slots = bl.map(b => { const a = el('article', 'hyp skel'); a.appendChild(el('p', 'src', 'Loading ' + b.name.split('-')[0].toUpperCase() + '...')); return a; });
      host.replaceChildren(...slots);
      const fill = async (slot, b) => {
        const x = await evalOne(b);
        let n;
        if (x.error) { n = el('article', 'hyp inconclusive'); n.appendChild(el('p', 'src', 'Card ' + b.name + ' could not run: ' + x.error)); } else n = compact(render(x.card, x.r));
        slot.replaceWith(n);
      };
      const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); fill(e.target, bl[slots.indexOf(e.target)]); } }), { rootMargin: '700px 0px' }) : null;
      slots.forEach((s, i) => io ? io.observe(s) : fill(s, bl[i]));
      const t = await tally(), c = { supported: 0, refuted: 0, inconclusive: 0 };
      t.filter(x => !x.error && !x.audience).forEach(x => { c[x.verdict]++; });
      const tl = document.getElementById('hyp_tally'); if (tl) tl.textContent = c.supported + ' supported, ' + c.refuted + ' refuted, ' + c.inconclusive + ' inconclusive';
    } catch (e) { host.textContent = 'Could not load hypotheses: ' + e.message; }
  }
})();
