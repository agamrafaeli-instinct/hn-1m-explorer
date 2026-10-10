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

  // ---- Throughline stories (docs/THROUGHLINE_SPEC.md) ----
  const nfmt = x => Math.round(x).toLocaleString('en-US');
  const rowsOf = (card, data, g) => {
    const rows = card.check.path.split('.').reduce((o, k) => o && o[k], data), ix = card.check['group_' + g].indices, n = rows.length;
    return { rows, pick: HypEval.resolve(ix, n).map(i => rows[i]) };
  };
  function storyVars(story, card, data, r) {
    const c = card.check, v = {}, pct = !!c.display_pct;
    const f = x => pct ? (x * 100).toFixed(2) + '%' : (Math.abs(x) >= 10 ? x.toFixed(1) : x.toFixed(2));
    v.ratio = r.value.toFixed(2); v.a = f(r.mean_a); v.b = f(r.mean_b); v.label_a = r.label_a || c.group_a.label; v.label_b = r.label_b || c.group_b.label;
    const win = g => {
      const x = rowsOf(card, data, g).pick, k = c.label_field; if (!k || !x.length) return null;
      const A = String(x[0][k]), B = String(x[x.length - 1][k]);
      if (/^\d{4}-\d{2}-\d{2}$/.test(A)) return dstr(new Date(A)) + ' to ' + dstr(new Date(Date.parse(B) + 6 * 864e5));
      if (/^\d{4}-\d{2}$/.test(A)) return mon(A) + ' to ' + mon(B);
      return null;
    };
    v.window_a = win('a'); v.window_b = win('b');
    const rule = w => (card.verdicts || []).find(y => y.verdict === w && y.when);
    v.support_at = rule('supported') ? rule('supported').when.value : null; v.refute_at = rule('refuted') ? rule('refuted').when.value : null;
    const raw = {};
    Object.keys(story.counts || {}).forEach(k => { const d = story.counts[k]; raw[k] = rowsOf(card, data, d.group).pick.reduce((t, x) => t + (+x[d.field] || 0), 0); v[k] = nfmt(raw[k]); });
    if (raw.n_a != null && raw.t_a) v.share_a = (raw.n_a / raw.t_a * 100).toFixed(2) + '%';
    if (raw.n_b != null && raw.t_b) v.share_b = (raw.n_b / raw.t_b * 100).toFixed(2) + '%';
    return v;
  }
  const fillTpl = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => v[k]);
  function storyOk(story, verdict, v) {
    const names = ((story.opening || '') + (story.takeaway || '')).match(/\{(\w+)\}/g) || [];
    return story.for_verdict === verdict && names.every(n => { const x = v[n.slice(1, -1)]; return x != null && x !== '' && !/NaN|undefined/.test(String(x)); });
  }
  // Two bars with the values on them and the ratio written above, plus a text description for assistive tech.
  function storyChart(card, r, la, lb, desc) {
    const k = card.check, W = 320, H = 150, base = 118, max = Math.max(r.mean_a, r.mean_b) || 1;
    const s = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': desc });
    [[r.mean_b, 'b-b', 50, lb], [r.mean_a, 'b-a', 190, la]].forEach(([x, cls, px, lab]) => {
      const h = Math.max(2, (x / max) * 68);
      s.appendChild(sv('rect', { x: px, y: base - h, width: 80, height: h, rx: 3, class: cls }));
      s.appendChild(sv('text', { x: px + 40, y: base - h - 6, 'text-anchor': 'middle', class: 'g-val' }, fmtN(x, k)));
      s.appendChild(sv('text', { x: px + 40, y: base + 14, 'text-anchor': 'middle', class: 'g-lab' }, lab.length > 24 ? lab.slice(0, 23) + '\u2026' : lab));
    });
    s.appendChild(sv('text', { x: W / 2, y: 16, 'text-anchor': 'middle', class: 'g-val' }, 'ratio ' + fmt(r.value) + (k.unit || 'x')));
    s.appendChild(sv('path', { d: 'M50 24 H130 M190 24 H270', class: 'g-tick', fill: 'none' }));
    return s;
  }
  function rulesLabel(card) {
    const t = JSON.stringify([card.caveats, card.expect, card.rules]);
    if (/exploratory|set after|after (seeing|earlier)|saved after/i.test(t)) return 'Thresholds saved after earlier summaries were seen (exploratory).';
    if (/set before|in advance|before the test/i.test(t)) return 'Thresholds set before the test.';
    return 'Thresholds as declared on the card.';
  }


  // Honor scorecard (data/honor.json): one quality line in card details. Missing file shows nothing.
  const QR = { sharp: 'two named groups, a source that resolves, numeric rules', interesting: 'an audience tag and a why-care line', fresh: 'the verdict changed within the last 14 logged days', relevant: 'an audience tag and at least 30 matching items', insightful: 'a different comparison group, a numeric rule and a caveat', novel: 'no older card with the same fields or title' };
  let honorP; const honor = () => honorP || (honorP = get('data/honor.json').then(d => { const m = {}; d.cards.forEach(c => { m[c.id] = c; }); return m; }).catch(() => null));
  function qualityBlock(q) {
    if (!q) return null;
    const box = el('div', 'cav'); box.appendChild(el('b', '', 'Quality checks'));
    Object.keys(q.criteria).forEach(k => {
      const v = q.criteria[k]; if (v === null) return;
      box.appendChild(el('p', '', k + ': ' + (v ? 'pass' : 'fail, needs ' + QR[k])));
    });
    return box;
  }
  // Context only (#130): the monthly title share for the card's topic, loaded when asked. The verdict never reads from it.
  let TS;
  function contextBlock(card) {
    const key = String(card.check.field || '').replace(/_[sph]$/, ''), box = el('div', 'ctx');
    const b = el('button', 'ctx-btn', 'Show the monthly line, 2006 to now'); b.type = 'button'; box.appendChild(b);
    b.addEventListener('click', async () => {
      b.disabled = true; b.textContent = 'Loading...';
      try {
        TS = TS || await fetch('data/topic_series.json').then(r => r.json());
        const t = TS.topics.find(x => x.id === key); if (!t) { box.remove(); return; }
        const W = 320, H = 110, pl = 4, pt = 8, pb = 16, n = t.series.length, sm = t.series.map((_, i) => { const x = t.series.slice(Math.max(0, i - 5), i + 1); return x.reduce((u, w) => u + w, 0) / x.length; }), mx = Math.max.apply(null, sm) || 1;
        const X = i => pl + (W - 2 * pl) * i / (n - 1), Y = v => pt + (H - pt - pb) * (1 - v / mx);
        const s = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Monthly share of story titles for ' + t.label + ', ' + TS.months[0] + ' to ' + TS.months[n - 1] + ', 6-month average. Peak ' + (mx * 100).toFixed(2) + '%.' });
        s.appendChild(sv('rect', { x: X(n - 12), y: pt, width: X(n - 1) - X(n - 12), height: H - pt - pb, class: 'ctx-band' }));
        s.appendChild(sv('path', { d: sm.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(''), class: 'ctx-line', fill: 'none' }));
        s.appendChild(sv('text', { x: pl, y: H - 3, class: 'g-lab' }, TS.months[0].slice(0, 4)));
        s.appendChild(sv('text', { x: W - pl, y: H - 3, 'text-anchor': 'end', class: 'g-lab' }, TS.months[n - 1].slice(0, 4)));
        s.appendChild(sv('text', { x: pl, y: pt + 8, class: 'g-lab' }, 'peak ' + (mx * 100).toFixed(2) + '%'));
        box.replaceChildren(s, el('p', 'ctx-note', 'Context only: monthly share of story titles for ' + t.label + ', 6-month average, 2006 to ' + TS.months[n - 1].slice(0, 4) + '. The shaded band is the latest 12 months. The verdict above reads only from the card\'s own windows.'));
      } catch (e) { b.disabled = false; b.textContent = 'Could not load. Try again'; }
    });
    return box;
  }
  function storyBody(a, card, r, la, lb) {
    const st = r.story.story, v = r.story.vars, k = card.check;
    a.classList.add('tl');
    a.appendChild(el('h3', '', st.question));
    a.appendChild(el('p', 'tested', 'Tested proposition: ' + card.hypothesis));
    step(a, 'Why care', el('p', '', st.why));
    const opening = fillTpl(st.opening, v), take = fillTpl(st.takeaway, v);
    const lg = el('p', 'hyp-lg'); lg.appendChild(el('span', 'sw a')); lg.appendChild(document.createTextNode(la)); lg.appendChild(el('span', 'sw b')); lg.appendChild(document.createTextNode(lb));
    const desc = la + ' ' + fmtN(r.mean_a, k) + ', ' + lb + ' ' + fmtN(r.mean_b, k) + ', ratio ' + fmt(r.value) + (k.unit || 'x') + '.';
    step(a, 'What we saw', [el('p', '', opening), storyChart(card, r, la, lb, desc), lg]);
    step(a, 'Takeaway', el('p', 'take', take));
    { const cx = contextBlock(card); if (cx) step(a, 'Context', cx); }
    const bd = step(a, 'Keep in mind', el('p', 'boundary', st.boundary));
    if (st.explore && st.explore.length) {
      const p = el('p', 'xlink'), key = { engineers: 'engineers', 'deep-tech investors': 'vcs', 'curious readers': 'geeks' }[card.audience] || 'all';
      st.explore.forEach((id, i) => { if (i) p.appendChild(document.createTextNode(', ')); const l = el('a', '', id.toUpperCase()); l.href = '#/c/' + id + '/' + key; p.appendChild(l); });
      step(a, 'Explore further', p);
    }
    const V = VERDICT[r.verdict], vb = el('div', 'verdict');
    vb.appendChild(el('b', '', V[0])); vb.appendChild(el('span', '', V[1] + (CONF[r.confidence] ? ' ' + CONF[r.confidence] : '')));
    step(a, 'Verdict', vb);
    a.appendChild(detailsBlock(card, r));
    a.classList.add('compact');
  }
  function detailsBlock(card, r) {
    const k = card.check, d = el('details', 'more-d'); d.appendChild(el('summary', '', 'Caveats, the rules we set, source'));
    d.appendChild(gauge(card, r));
    d.appendChild(el('p', 'hyp-rules', rulesLabel(card)));
    const ex = el('p', 'hyp-ex'); ex.appendChild(el('b', '', 'Rule: ')); ex.appendChild(document.createTextNode(card.expect.replace(/^If true,\\s*/i, ''))); d.appendChild(ex);
    if (r.win) d.appendChild(el('p', 'hyp-cov', 'Data window: ' + r.win + '.'));
    if (card.caveats && card.caveats.length) { const bx = el('div', 'cav'); bx.appendChild(el('b', '', 'Caveats')); card.caveats.forEach(t => bx.appendChild(el('p', '', t))); d.appendChild(bx); }
    { const qb = qualityBlock(r.quality); if (qb) d.appendChild(qb); }
    d.appendChild(el('p', 'src', 'Check: ' + k.source + ' \\u203a ' + k.path + '.' + k.field + (card.author ? ' \\u00b7 by ' + card.author : '')));
    return d;
  }
  function render(card, r) {
    TH = (card.verdicts || []).filter(x => x.when).map(x => x.when.value);
    const k = card.check, split = r.split && !/^\d{4}-/.test(String((r.labels || [])[0] || ''));
    const la = split ? (k.legend_a || 'Matching stories') : (r.label_a || k.group_a.label), lb = split ? (k.legend_b || 'Everything else') : (r.label_b || k.group_b.label);
    const per = k.per_label || (k.path.endsWith('hour') ? 'per hour' : k.normalize ? 'per day' : 'average');
    const a = el('article', 'hyp narr ' + r.verdict);
    const top = el('div', 'hyp-top'); top.appendChild(el('p', 'hyp-id', card.id + (card.audience ? ' \u00b7 for ' + card.audience : '')));
    const key = { engineers: 'engineers', 'deep-tech investors': 'vcs', 'curious readers': 'geeks' }[card.audience] || 'all';
    const sh = el('button', 'share-btn', 'Share'); sh.type = 'button'; sh.dataset.url = location.origin + location.pathname + '#/c/' + card.id + '/' + key;
    sh.setAttribute('aria-label', 'Share this card');
    sh.addEventListener('click', async () => {
      const url = sh.dataset.url;
      try { if (navigator.share) { await navigator.share({ title: card.title, text: card.title + ' (Hacker News, tested)', url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(url); } catch (e) { const t = document.createElement('textarea'); t.value = url; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e2) { } t.remove(); }
      sh.textContent = 'Link copied'; setTimeout(() => { sh.textContent = 'Share'; }, 2000);
    });
    top.appendChild(sh); a.appendChild(top);
    if (r.story) { storyBody(a, card, r, la, lb); return a; }
    // 1. the guess
    a.appendChild(el('h3', '', card.title));
    if (r.storyReview) a.appendChild(el('p', 'hnote diff', 'This story needs review after the latest refresh.'));
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
      step(a, 'Longer context', [bars(card, h), lg2, el('p', 'take', h.win + ': ' + la + ' ' + fmtN(h.mean_a, k) + ', ' + lb + ' ' + fmtN(h.mean_b, k) + ', ratio ' + fmt(h.value) + (k.unit || 'x') + '.'),
        (k.field === 'points' ? el('p', 'hnote diff', 'Caution: archive points per story shift level in Dec 2023 and Jan 2026 (about 2, then 12 to 16, then about 2), cause unknown. Treat this check as rough.') : document.createTextNode('')), el('p', 'hnote' + (same ? '' : ' diff'), same ? 'The same rules give the same call over the longer history.' : 'Different call: the same rules over the longer history would read ' + hv + ', not ' + VERDICT[r.verdict][0].toLowerCase() + '. The verdict below stays based on the newest window.')]);
    }
    if (r.strip) {
      step(a, 'Longer context', [strip(r.strip.series, r.strip.labels), el('p', 'take', r.strip.name + ': share of stories matching "rust" each month, ' + r.strip.win + '. Zig and the other words in this card are not in the archive\'s term list, so this is not the same measure as the chart above.')]);
    }
    // 5. verdict in plain words
    const V = VERDICT[r.verdict], vb = el('div', 'verdict');
    vb.appendChild(el('b', '', V[0])); vb.appendChild(el('span', '', V[1] + (CONF[r.confidence] ? ' ' + CONF[r.confidence] : '')));
    step(a, 'Verdict', vb);
    // 6. folded: rules, gauge, caveats, source
    const d = el('details', 'more-d'); d.appendChild(el('summary', '', 'Caveats, the rules we set, source'));
    d.appendChild(gauge(card, r));
    d.appendChild(el('p', 'hyp-rules', rulesLabel(card)));
    const ex = el('p', 'hyp-ex'); ex.appendChild(el('b', '', 'Rule: ')); ex.appendChild(document.createTextNode(card.expect.replace(/^If true,\s*/i, ''))); d.appendChild(ex);
    if (r.win) d.appendChild(el('p', 'hyp-cov', 'Data window: ' + r.win + '.'));
    if (card.caveats && card.caveats.length) { const bx = el('div', 'cav'); bx.appendChild(el('b', '', 'Caveats')); card.caveats.forEach(t => bx.appendChild(el('p', '', t))); d.appendChild(bx); }
    { const qb = qualityBlock(r.quality); if (qb) d.appendChild(qb); }
    d.appendChild(el('p', 'src', 'Check: ' + k.source + ' \u203a ' + k.path + '.' + k.field + (card.author ? ' \u00b7 by ' + card.author : '')));
    a.appendChild(d); a.classList.add('compact');
    return a;
  }
  const get = u => fetch(u).then(r => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });
  let bundleP, tallyP, allP; const srcC = {};
  const source = s => srcC[s] || (srcC[s] = get(s));
  let storyIdxP; const storyIndex = () => storyIdxP || (storyIdxP = get('stories/index.json').then(x => x.ids).catch(() => []));
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
      if (l0.month || (l0.label === undefined && /monthly/.test(p))) return 'monthly keyword counts, ' + mon(rows[0].month) + ' to ' + mon(rows[rows.length - 1].month) + ', not the full HN archive';
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
      try { const H = await honor(); if (H && H[b.card.id]) r.quality = H[b.card.id]; } catch (e) { }
      try {
        const idx = await storyIndex();
        if (idx.includes(b.card.id)) {
          const story = await get('stories/' + b.card.id + '.json'), vars = storyVars(story, b.card, data, r);
          if (storyOk(story, r.verdict, vars)) r.story = { story, vars }; else r.storyReview = true;
        }
      } catch (e) { if (!/404/.test(String(e.message))) r.storyReview = true; }
      try {
        if (b.card.check.path === 'concentration.cyclic.weekday') {
          const H = await source('data/history/strips.json'), w = H.weekday;
          const syn = { time_range: H.time_range, concentration: { cyclic: { weekday: [0, 1, 2, 3, 4, 5, 6].map(i => ({ posts: w.posts[i], points: w.points[i], comments: w.comments[i] })) } } };
          r.hist = HypEval.evaluate(b.card, syn); r.hist.win = 'Context: ' + mon(H.first) + ' to ' + mon(H.last) + ', daily counts of the saved history, not the full HN archive';
        } else if (b.card.id === 'h009') {
          const H = await source('data/history/strips.json');
          r.strip = { labels: H.months, series: H.term_share.rust, name: 'Rust alone', win: 'Context: ' + mon(H.first) + ' to ' + mon(H.last) + ', not the full HN archive' };
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
      const H = await honor();
      slots.forEach((sl, i) => { const q = H && H[bl[i].name.split('-')[0]]; sl.dataset.flag = q && q.failing.length ? '1' : '0'; });
      if (H) {
        const nflag = slots.filter(sl => sl.dataset.flag === '1').length, hostP = host.parentNode;
        if (nflag && hostP && !document.getElementById('hyp_flag')) {
          const b = el('button', 'flag-btn', 'Show only cards flagged for upgrade (' + nflag + ')'); b.type = 'button'; b.id = 'hyp_flag'; b.setAttribute('aria-pressed', 'false');
          b.addEventListener('click', () => { const on = host.classList.toggle('only-flagged'); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? 'Show all cards' : 'Show only cards flagged for upgrade (' + nflag + ')'; });
          hostP.insertBefore(b, host);
        }
      }
      host.replaceChildren(...slots);
      const fill = async (slot, b) => {
        const x = await evalOne(b);
        let n;
        if (x.error) { n = el('article', 'hyp inconclusive'); n.appendChild(el('p', 'src', 'Card ' + b.name + ' could not run: ' + x.error)); } else n = compact(render(x.card, x.r));
        n.dataset.flag = slot.dataset.flag || '0'; slot.replaceWith(n);
      };
      const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); fill(e.target, bl[slots.indexOf(e.target)]); } }), { rootMargin: '700px 0px' }) : null;
      slots.forEach((s, i) => io ? io.observe(s) : fill(s, bl[i]));
      const t = await tally(), c = { supported: 0, refuted: 0, inconclusive: 0 };
      t.filter(x => !x.error).forEach(x => { c[x.verdict]++; });
      const tl = document.getElementById('hyp_tally'); if (tl) tl.textContent = c.supported + ' supported, ' + c.refuted + ' refuted, ' + c.inconclusive + ' inconclusive';
    } catch (e) { host.textContent = 'Could not load hypotheses: ' + e.message; }
  }
})();
