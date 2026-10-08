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
  function evaluate(card, summary) {
    const c = card.check, rows = dig(summary, c.path);
    if (!Array.isArray(rows)) throw new Error('path not found: ' + c.path);
    let vals = rows.map(r => +r[c.field] || 0);
    if (c.normalize === 'per_weekday_occurrence') { const d = weekdayDays(summary.time_range); vals = vals.map((v, i) => d[i] ? v / d[i] : 0); }
    const mean = ix => ix.reduce((s, i) => s + vals[i], 0) / ix.length;
    const a = mean(c.group_a.indices), b = mean(c.group_b.indices);
    if (c.stat !== 'mean_ratio_a_over_b') throw new Error('unknown stat: ' + c.stat);
    const value = b ? a / b : null;
    let out = { verdict: 'inconclusive', confidence: 'inconclusive', rule: null };
    if (value != null) for (const r of card.verdicts) {
      if (r.else || OPS[r.when.op](value, r.when.value)) { out = { verdict: r.verdict, confidence: r.confidence, rule: r }; break; }
    }
    return { value, mean_a: a, mean_b: b, series: vals, verdict: out.verdict, confidence: out.confidence, rule: out.rule };
  }
  const api = { evaluate, weekdayDays };
  if (typeof module !== 'undefined') module.exports = api; else root.HypEval = api;
})(typeof self !== 'undefined' ? self : this);
