'use strict';
// Evaluates a hypothesis card against data/summary.json. Pure function, no eval, runs in browser and node.
(function (root) {
  const OPS = { '>=': (a, b) => a >= b, '<=': (a, b) => a <= b, '>': (a, b) => a > b, '<': (a, b) => a < b };
  function dig(obj, path) { return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj); }
  // Share of each UTC weekday (Mon=0) in the data window, in days. Used to turn totals into per-day rates.
  function weekdayDays(tr) {
    const d = new Array(7).fill(0), a = tr.min, b = tr.max;
    for (let t = Math.floor(a / 86400) * 86400; t <= b; t += 86400) {
      const lo = Math.max(t, a), hi = Math.min(t + 86400, b), wd = (new Date(t * 1000).getUTCDay() + 6) % 7;
      d[wd] += Math.max(0, hi - lo) / 86400;
    }
    return d;
  }
  // indices: list of row numbers; negative counts from the end (-1 = latest); "all" = every row.
  function resolve(ix, n) {
    if (ix === 'all') return Array.from({ length: n }, (_, i) => i);
    // Film cards: {"last": N} = the latest N rows, {"before_last": N} = every row before the latest N (the pooled base).
    if (ix && ix.last) return Array.from({ length: Math.min(ix.last, n) }, (_, i) => n - Math.min(ix.last, n) + i);
    if (ix && ix.before_last) return Array.from({ length: Math.max(0, n - ix.before_last) }, (_, i) => i);
    return ix.map(i => (i < 0 ? n + i : i)).filter(i => i >= 0 && i < n);
  }
  function evaluate(card, summary) {
    const c = card.check, rows = dig(summary, c.path);
    if (!Array.isArray(rows)) throw new Error('path not found: ' + c.path);
    const wd = c.normalize === 'per_weekday_occurrence' ? weekdayDays(summary.time_range) : null;
    // A group may name its own field (and a "per" field to divide by); otherwise it uses check.field.
    const series = g => rows.map((r, i) => {
      let v = +r[g.field || c.field] || 0;
      if (g.per) v = (+r[g.per]) ? v / +r[g.per] : 0;
      if (wd) v = wd[i] ? v / wd[i] : 0;
      return v;
    });
    const sa = series(c.group_a), sb = series(c.group_b), ia = resolve(c.group_a.indices, rows.length), ib = resolve(c.group_b.indices, rows.length);
    if (!ia.length || !ib.length) throw new Error('group has no rows');
    const mean = (v, ix) => ix.reduce((s, i) => s + v[i], 0) / ix.length;
    // pooled_share_ratio: share = sum(field) / sum(per) over the whole group, so busy months weigh more than quiet ones.
    const pooled = (g, ix) => { const num = ix.reduce((s, i) => s + (+rows[i][g.field || c.field] || 0), 0), den = ix.reduce((s, i) => s + (+rows[i][g.per] || 0), 0); return den ? num / den : 0; };
    let a, b;
    if (c.stat === 'pooled_share_ratio') { a = pooled(c.group_a, ia); b = pooled(c.group_b, ib); }
    else if (c.stat === 'mean_ratio_a_over_b') { a = mean(sa, ia); b = mean(sb, ib); }
    else throw new Error('unknown stat: ' + c.stat);
    const value = b ? a / b : null;
    let out = { verdict: 'inconclusive', confidence: 'inconclusive', rule: null };
    if (value != null) for (const r of card.verdicts) {
      if (r.else || OPS[r.when.op](value, r.when.value)) { out = { verdict: r.verdict, confidence: r.confidence, rule: r }; break; }
    }
    // Group labels may hold {from} and {to}; they are filled with the first and last row label so the base window is always stated.
    const lab = (g, ix) => String(g.label || '').replace('{from}', c.label_field ? rows[ix[0]][c.label_field] : '').replace('{to}', c.label_field ? rows[ix[ix.length - 1]][c.label_field] : '');
    const labels = c.label_field ? rows.map(r => String(r[c.label_field])) : c.labels;
    return { value, mean_a: a, mean_b: b, series: sa, series_b: sb, split: (c.group_a.field || c.field) !== (c.group_b.field || c.field),
      ia, ib, label_a: lab(c.group_a, ia), label_b: lab(c.group_b, ib), labels, verdict: out.verdict, confidence: out.confidence, rule: out.rule };
  }
  const api = { evaluate, weekdayDays, resolve };
  if (typeof module !== 'undefined') module.exports = api; else root.HypEval = api;
})(typeof self !== 'undefined' ? self : this);
