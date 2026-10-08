'use strict';
// Renders hypothesis cards from hypotheses/*.json. Card text comes from PRs: only textContent, never innerHTML.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const sv = (tag, at, txt) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (txt != null) e.textContent = txt; return e; };
  const fmt = v => v == null ? 'n/a' : (v >= 10 ? v.toFixed(1) : v.toFixed(2));
  const LABEL = { supported: 'Supported', refuted: 'Refuted', inconclusive: 'Inconclusive' };

  function gauge(card, r) {
    const th = card.verdicts.filter(x => x.when).map(x => x.when.value), unit = card.check.unit || '';
    const max = Math.max(2, r.value * 1.15, Math.max.apply(null, th) * 1.2), W = 320, X = v => 12 + (v / max) * (W - 24);
    const s = sv('svg', { viewBox: '0 0 ' + W + ' 74', role: 'img', 'aria-label': 'Measured ' + fmt(r.value) + unit + ' against the verdict thresholds' });
    s.appendChild(sv('line', { x1: 12, x2: W - 12, y1: 36, y2: 36, class: 'g-track' }));
    let lastX = -99;
    [...new Set(th)].sort((a, b) => a - b).forEach(t => {
      s.appendChild(sv('line', { x1: X(t), x2: X(t), y1: 26, y2: 46, class: 'g-tick' }));
      if (X(t) - lastX < 34) return; lastX = X(t);
      s.appendChild(sv('text', { x: X(t), y: 62, 'text-anchor': 'middle', class: 'g-lab' }, fmt(t) + unit));
    });
    s.appendChild(sv('circle', { cx: X(r.value), cy: 36, r: 9, class: 'g-dot' }));
    s.appendChild(sv('text', { x: Math.min(Math.max(X(r.value), 28), W - 28), y: 18, 'text-anchor': 'middle', class: 'g-val' }, fmt(r.value) + unit));
    return s;
  }
  function bars(card, r) {
    const c = card.check, n = r.series.length, max = Math.max.apply(null, r.series) || 1, W = 320, H = 110, bw = (W - 8) / n;
    const s = sv('svg', { viewBox: '0 0 ' + W + ' ' + (H + 16), role: 'img', 'aria-label': 'Values by ' + c.field });
    r.series.forEach((v, i) => {
      const h = Math.max(1, (v / max) * H), cls = c.group_a.indices.includes(i) ? 'b-a' : c.group_b.indices.includes(i) ? 'b-b' : 'b-x';
      s.appendChild(sv('rect', { x: 4 + i * bw + bw * 0.12, y: H - h, width: bw * 0.76, height: h, rx: 2, class: cls }));
      if (n <= 12 || i % 3 === 0) s.appendChild(sv('text', { x: 4 + i * bw + bw / 2, y: H + 12, 'text-anchor': 'middle', class: 'g-lab' }, (c.labels && c.labels[i]) || String(i)));
    });
    return s;
  }
  function render(card, r) {
    const a = el('article', 'hyp ' + r.verdict);
    const top = el('div', 'hyp-top'); top.appendChild(el('span', 'hyp-id', card.id));
    top.appendChild(el('span', 'hyp-badge', LABEL[r.verdict] + ' \u00b7 ' + r.confidence)); a.appendChild(top);
    a.appendChild(el('h3', '', card.title));
    a.appendChild(el('p', 'hyp-q', card.hypothesis));
    const ex = el('p', 'hyp-ex'); ex.appendChild(el('b', '', 'If true: ')); ex.appendChild(document.createTextNode(card.expect.replace(/^If true,\s*/i, ''))); a.appendChild(ex);
    const k = card.check;
    const meas = el('p', 'hyp-m'); meas.appendChild(el('b', '', 'Measured: ')); meas.appendChild(document.createTextNode(
      k.group_a.label + ' ' + Math.round(r.mean_a).toLocaleString() + ' vs ' + k.group_b.label + ' ' + Math.round(r.mean_b).toLocaleString() + ' (per ' + (k.path.endsWith('hour') ? 'hour' : 'day') + '), ratio ' + fmt(r.value) + (k.unit || '')));
    a.appendChild(meas);
    a.appendChild(gauge(card, r)); a.appendChild(bars(card, r));
    const lg = el('p', 'hyp-lg'); lg.appendChild(el('span', 'sw a')); lg.appendChild(document.createTextNode(k.group_a.label)); lg.appendChild(el('span', 'sw b')); lg.appendChild(document.createTextNode(k.group_b.label)); a.appendChild(lg);
    if (card.caveats && card.caveats.length) {
      const d = el('details', 'pts sm'); d.appendChild(el('summary', '', 'Caveats'));
      const box = el('div'); card.caveats.forEach(t => box.appendChild(el('p', '', t))); d.appendChild(box); a.appendChild(d);
    }
    a.appendChild(el('p', 'src', 'Check: ' + k.source + ' \u203a ' + k.path + '.' + k.field + (card.author ? ' \u00b7 by ' + card.author : '')));
    return a;
  }
  async function init() {
    const host = document.getElementById('hyp_list'); if (!host) return;
    const get = u => fetch(u).then(r => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });
    const names = await get('hypotheses/index.json'), cache = {}, out = [];
    for (const n of names) {
      try {
        const card = await get('hypotheses/' + n + '.json'), src = card.check.source;
        if (!/^data\/[\w.-]+\.json$/.test(src)) throw new Error('source must be data/*.json');
        const sum = cache[src] || (cache[src] = await get(src)), r = HypEval.evaluate(card, sum);
        out.push(render(card, r));
      } catch (e) { const b = el('article', 'hyp inconclusive'); b.appendChild(el('p', 'src', 'Card ' + n + ' could not run: ' + e.message)); out.push(b); }
    }
    host.replaceChildren(...out);
    const c = { supported: 0, refuted: 0, inconclusive: 0 };
    host.querySelectorAll('.hyp').forEach(x => { for (const k in c) if (x.classList.contains(k)) c[k]++; });
    const t = document.getElementById('hyp_tally'); if (t) t.textContent = c.supported + ' supported, ' + c.refuted + ' refuted, ' + c.inconclusive + ' inconclusive';
  }
  init().catch(e => { const h = document.getElementById('hyp_list'); if (h) h.textContent = 'Could not load hypotheses: ' + e.message; });
})();
