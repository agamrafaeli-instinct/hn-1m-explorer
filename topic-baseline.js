(function (root) {
  'use strict';
  function compare(film, topics, id, range) {
    var topic = topics.topics.find(function (t) { return t.id === id; }), term = film.terms[id];
    if (!topic || !term) throw new Error('Unknown topic');
    if (topic.matcher !== term.pattern) throw new Error('Topic dictionaries disagree');
    var window = topics.windows.latest, first = window[0], last = window[1];
    if (!/^\d{4}-\d{2}$/.test(first) || !/^\d{4}-\d{2}$/.test(last) || first > last) throw new Error('Invalid latest window');
    if (range && (!Number.isInteger(range.from) || !Number.isInteger(range.to) || range.from > range.to)) throw new Error('Invalid baseline range');
    if (range && range.to >= Number(first.slice(0, 4))) throw new Error('Baseline overlaps latest window');
    var rows = film.monthly.slice().sort(function (a, b) { return a.month.localeCompare(b.month); }), seen = {};
    rows.forEach(function (r) {
      if (!/^\d{4}-\d{2}$/.test(r.month) || seen[r.month]) throw new Error('Invalid or duplicate source month');
      seen[r.month] = true;
      if (!Number.isFinite(r.total) || !Number.isFinite(r[id + '_s']) || r.total < 0 || r[id + '_s'] < 0 || r[id + '_s'] > r.total) throw new Error('Invalid source counts');
    });
    function pool(selected) {
      var n = 0, total = 0;
      selected.forEach(function (r) { n += r[id + '_s']; total += r.total; });
      return { n: n, total: total, share: selected.length && total > 0 ? n / total : null, months: selected.map(function (r) { return r.month; }) };
    }
    var latest = pool(rows.filter(function (r) { return r.month >= first && r.month <= last; }));
    var earlier = rows.filter(function (r) { var y = Number(r.month.slice(0, 4)); return r.month < first && (!range || (y >= range.from && y <= range.to)); });
    var baseline = pool(earlier), ratio = latest.share !== null && baseline.share !== null && baseline.share > 0 ? latest.share / baseline.share : null;
    var years = Array.from(new Set(rows.filter(function (r) { return Number(r.month.slice(0, 4)) < Number(first.slice(0, 4)); }).map(function (r) { return Number(r.month.slice(0, 4)); }))).sort(function (a, b) { return a - b; });
    return { id: id, latest: latest, baseline: baseline, ratio: ratio, eligibleYears: years };
  }
  var api = { compare: compare };
  if (typeof module !== 'undefined') module.exports = api; else root.TopicBaseline = api;
})(typeof window !== 'undefined' ? window : globalThis);
