(function () {
  'use strict';
  // Compare view (#169 stage 1): one chart, labels on the lines, state in the URL: #/compare?topics=rust,go&measure=share
  var D = null, loading = null;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function S(t, a) { var e = document.createElementNS('http://www.w3.org/2000/svg', t); for (var k in a) e.setAttribute(k, a[k]); return e; }
  var pct = function (v) { return (v < 0.1 ? v.toFixed(3) : v < 1 ? v.toFixed(2) : v.toFixed(1)) + '%'; };
  var COL = ['#ff6600', '#1b1b1b', '#3b7ea1', '#8a6bbf', '#2e8b57', '#b5651d'];
  function state() {
    var q = (location.hash.split('?')[1] || ''), o = {};
    q.split('&').forEach(function (p) { var i = p.indexOf('='); if (i > 0) o[p.slice(0, i)] = decodeURIComponent(p.slice(i + 1)); });
    var tp = location.hash.match(/^#\/t\/([^?\/]+)/); if (tp && D.byId[tp[1]]) o.topics = o.topics || tp[1];
    var ids = (o.topics || '').split(',').filter(function (x) { return D.byId[x]; });
    if (!ids.length) ids = defaults();
    return { topics: ids.slice(0, 6) };
  }
  function defaults() {
    // one topic per pattern, the one with the largest change between windows, so the first view shows different shapes
    var by = {};
    D.topics.filter(function (t) { return t.ratio && t.latest.share > 0.0003; }).forEach(function (t) {
      var m = Math.max(t.ratio, 1 / t.ratio), b = by[t.pattern]; if (!b || m > b.m) by[t.pattern] = { m: m, id: t.id }; });
    return ['Reversal', 'Emergence', 'Peak decay', 'Composition shift', 'Steady'].filter(function (p) { return by[p]; }).map(function (p) { return by[p].id; }).slice(0, 5);
  }
  function short(l) { return l.split(/, | and /)[0]; }
  function go(ids) { location.hash = '#/compare?topics=' + ids.join(','); }
  function topicId() { var m = location.hash.match(/^#\/t\/([^?\/]+)/); return m && D.byId[m[1]] ? m[1] : null; }
  function smooth(s) { return s.map(function (_, i) { var a = s.slice(Math.max(0, i - 5), i + 1); return a.reduce(function (x, y) { return x + y; }, 0) / a.length * 100; }); }
  function draw() {
    var st = state(), root = document.getElementById('cmp'); root.replaceChildren();
    var tops = st.topics.map(function (id) { return D.byId[id]; });
    var home = /^#?\/?(\?.*)?$/.test(location.hash);
    var tid = topicId();
    root.appendChild(el('h2', 'cmp_t', home ? 'How has conversation shifted on HN over time?' : tid ? D.byId[tid].label : 'Share of Hacker News story titles'));
    root.appendChild(el('p', 'cmp_s', 'By month, 6-month average, 2006 to ' + D.months[D.months.length - 1].slice(0, 4) + '. Title matching only. The shaded band is the latest 12 months. The vertical scale is square-root, so small topics stay visible.'));
    if (tid) { var t0 = D.byId[tid]; var bd = el('span', 'cmp_badge', t0.pattern + (t0.ratio ? ' \u00b7 ' + (t0.ratio >= 10 ? t0.ratio.toFixed(0) : t0.ratio.toFixed(1)) + 'x the earlier share' : '')); root.appendChild(bd); }
    var box = el('div', 'cmp_box'), row = el('div', 'cmp_row'); root.appendChild(box); root.appendChild(row);
    var W = box.clientWidth || 360, H = box.clientHeight || 360, padL = 34, padR = 112, padT = 14, padB = 22;
    var ser = tops.map(function (t) { return smooth(t.series); }), n = D.months.length;
    var max = Math.max.apply(null, ser.map(function (s) { return Math.max.apply(null, s); })) * 1.08 || 1;
    var X = function (i) { return padL + (W - padL - padR) * i / (n - 1); }, Y = function (v) { return padT + (H - padT - padB) * (1 - Math.sqrt(Math.max(v, 0) / max)); };
    var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': 'Line chart of title share by month for ' + tops.map(function (t) { return t.label; }).join(', ') });
    svg.appendChild(S('rect', { x: X(n - 12), y: padT, width: X(n - 1) - X(n - 12), height: H - padT - padB, fill: '#f1e6d3' }));
    var ticks = [0].concat([0.1, 0.5, 1, 2, 5, 10].filter(function (v) { return v < max * 0.98; })); ticks = ticks.filter(function (v, i) { return i === 0 || Math.abs(Y(v) - Y(ticks[i - 1])) > 22; });
    ticks.forEach(function (v) { svg.appendChild(S('line', { x1: padL, x2: W - padR, y1: Y(v), y2: Y(v), stroke: '#efe6d6' })); });
    ticks.forEach(function (v) { var g = S('text', { x: padL - 4, y: Y(v) + 4, 'text-anchor': 'end', class: 'cmp_ax' }); g.textContent = v + '%'; svg.appendChild(g); });
    for (var y = 2010; y <= 2025; y += 5) { var i = D.months.indexOf(y + '-01'); if (i < 0) continue; var tx = S('text', { x: X(i), y: H - 6, 'text-anchor': 'middle', class: 'cmp_ax' }); tx.textContent = y; svg.appendChild(tx); }
    var ends = [];
    ser.forEach(function (s, k) {
      var d = s.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join('');
      svg.appendChild(S('path', { d: d, fill: 'none', stroke: COL[k], 'stroke-width': 2.2, 'stroke-linejoin': 'round' }));
      var pk = s.indexOf(Math.max.apply(null, s)); svg.appendChild(S('circle', { cx: X(pk), cy: Y(s[pk]), r: 3.5, fill: COL[k] }));
      ends.push({ k: k, y: Y(s[n - 1]), v: s[n - 1] });
    });
    ends.sort(function (a, b) { return a.y - b.y; });
    for (var j = 1; j < ends.length; j++) if (ends[j].y - ends[j - 1].y < 14) ends[j].y = ends[j - 1].y + 14;
    ends.forEach(function (e) { var t = S('text', { x: W - padR + 6, y: e.y + 4, fill: COL[e.k], class: 'cmp_lb' }); t.textContent = short(tops[e.k].label) + ' ' + pct(e.v); svg.appendChild(t); });
    box.appendChild(svg);
    tops.forEach(function (t, k) { var b = el('button', 'cmp_chip', short(t.label) + ' \u00d7'); b.style.borderColor = COL[k]; b.onclick = function () { go(st.topics.filter(function (x) { return x !== t.id; })); }; row.appendChild(b); });
    if (st.topics.length < 6) {
      var sel = el('select', 'cmp_add'); sel.appendChild(el('option', '', '+ topic')); sel.firstChild.value = '';
      D.topics.filter(function (t) { return st.topics.indexOf(t.id) < 0; }).sort(function (a, b) { return a.label < b.label ? -1 : 1; }).forEach(function (t) { var o = el('option', '', t.label); o.value = t.id; sel.appendChild(o); });
      sel.onchange = function () { if (sel.value) go(st.topics.concat(sel.value)); };
      row.appendChild(sel);
    }
    if (tid) { var t0 = D.byId[tid], b = el('button', 'cmp_chip cmp_det', 'Details'); b.onclick = function () { sheet(t0); }; row.insertBefore(b, row.firstChild);
       }
  }
  function sheet(t) {
    var d = document.createElement('dialog'); d.className = 'cmp_sheet';
    var w = D.windows, f = function (x) { return pct(x.share * 100) + ' (' + x.n.toLocaleString('en-US') + ' of ' + x.total.toLocaleString('en-US') + ' stories)'; };
    d.appendChild(el('h3', '', t.label));
    [['Latest 12 months, ' + w.latest[0] + ' to ' + w.latest[1], f(t.latest)], ['All earlier stories, ' + w.prior[0] + ' to ' + w.prior[1], f(t.prior)], ['Peak year', t.peak.year + ' at ' + pct(t.peak.share * 100)], ['Pattern', t.pattern], ['Word list (matches story titles, case-insensitive)', t.matcher]].forEach(function (r) { d.appendChild(el('b', '', r[0])); d.appendChild(el('p', '', r[1])); });
    var x = el('button', 'cmp_chip', 'Close'); x.onclick = function () { d.close(); d.remove(); }; d.appendChild(x); document.body.appendChild(d); d.showModal();
  }
  window.HowInit = function () {
    loading = loading || fetch('data/topic_series.json').then(function (r) { return r.json(); }).then(function (d) { d.byId = {}; d.topics.forEach(function (t) { d.byId[t.id] = t; }); D = d; });
    loading.then(function () { var e = document.getElementById('how_start'); if (e && D.months.length) e.textContent = D.months[0].slice(0, 4); });
  };
  window.TopicsInit = function () {
    loading = loading || fetch('data/topic_series.json').then(function (r) { return r.json(); }).then(function (d) { d.byId = {}; d.topics.forEach(function (t) { d.byId[t.id] = t; }); D = d; });
    loading.then(function () {
      var box = document.getElementById('topics_list'); box.replaceChildren();
      D.topics.slice().sort(function (a, b) { return a.label < b.label ? -1 : 1; }).forEach(function (t) {
        var a = el('a', 'tp_row'); a.href = '#/t/' + t.id; a.appendChild(el('b', '', t.label)); a.appendChild(el('span', 'tp_pat', t.pattern));
        var s = t.series.slice(-120), mx = Math.max.apply(null, s) || 1, svg = S('svg', { viewBox: '0 0 80 20', width: 80, height: 20 });
        svg.appendChild(S('path', { d: s.map(function (v, i) { return (i ? 'L' : 'M') + (i * 80 / 119).toFixed(1) + ' ' + (19 - 18 * v / mx).toFixed(1); }).join(''), fill: 'none', stroke: '#ff6600', 'stroke-width': 1.5 }));
        a.appendChild(svg); box.appendChild(a); });
    });
  };
  window.CompareInit = function () {
    loading = loading || fetch('data/topic_series.json').then(function (r) { return r.json(); }).then(function (d) { d.byId = {}; d.topics.forEach(function (t) { d.byId[t.id] = t; }); D = d; });
    loading.then(draw).catch(function () { document.getElementById('cmp').textContent = 'The comparison data could not be loaded. Try again.'; loading = null; });
  };
  addEventListener('resize', function () { if (D && document.getElementById('v_compare') && !document.getElementById('v_compare').hidden) draw(); });
})();
