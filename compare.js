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
    var ids = (o.topics || '').split(',').filter(function (x) { return D.byId[x]; });
    if (!ids.length) ids = defaults();
    return { topics: ids.slice(0, 6) };
  }
  function defaults() {
    return D.topics.filter(function (t) { return t.ratio; }).sort(function (a, b) {
      return Math.max(b.ratio, 1 / b.ratio) - Math.max(a.ratio, 1 / a.ratio); }).slice(0, 4).map(function (t) { return t.id; });
  }
  function go(ids) { location.hash = '#/compare?topics=' + ids.join(','); }
  function smooth(s) { return s.map(function (_, i) { var a = s.slice(Math.max(0, i - 5), i + 1); return a.reduce(function (x, y) { return x + y; }, 0) / a.length * 100; }); }
  function draw() {
    var st = state(), root = document.getElementById('cmp'); root.replaceChildren();
    var tops = st.topics.map(function (id) { return D.byId[id]; });
    root.appendChild(el('h2', 'cmp_t', 'Share of Hacker News story titles'));
    root.appendChild(el('p', 'cmp_s', 'By month, 6-month average, 2006 to ' + D.months[D.months.length - 1].slice(0, 4) + '. Title matching only. The shaded band is the latest 12 months.'));
    var box = el('div', 'cmp_box'), row = el('div', 'cmp_row'); root.appendChild(box); root.appendChild(row);
    var W = box.clientWidth || 360, H = box.clientHeight || 360, padL = 30, padR = 132, padT = 14, padB = 22;
    var ser = tops.map(function (t) { return smooth(t.series); }), n = D.months.length;
    var max = Math.max.apply(null, ser.map(function (s) { return Math.max.apply(null, s); })) * 1.08 || 1;
    var X = function (i) { return padL + (W - padL - padR) * i / (n - 1); }, Y = function (v) { return padT + (H - padT - padB) * (1 - v / max); };
    var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': 'Line chart of title share by month for ' + tops.map(function (t) { return t.label; }).join(', ') });
    svg.appendChild(S('rect', { x: X(n - 12), y: padT, width: X(n - 1) - X(n - 12), height: H - padT - padB, fill: '#f1e6d3' }));
    var ticks = [0, max / 2, max].map(function (v) { return Math.round(v * 100) / 100; });
    ticks.forEach(function (v) { var g = S('text', { x: padL - 4, y: Y(v) + 4, 'text-anchor': 'end', class: 'cmp_ax' }); g.textContent = (v === 0 ? '0' : pct(v)); svg.appendChild(g); });
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
    ends.forEach(function (e) { var t = S('text', { x: W - padR + 6, y: e.y + 4, fill: COL[e.k], class: 'cmp_lb' }); t.textContent = tops[e.k].label.replace(/ and .*/, '') + ' ' + pct(e.v); svg.appendChild(t); });
    box.appendChild(svg);
    tops.forEach(function (t, k) { var b = el('button', 'cmp_chip', t.label.replace(/ and .*/, '') + ' \u00d7'); b.style.borderColor = COL[k]; b.onclick = function () { go(st.topics.filter(function (x) { return x !== t.id; })); }; row.appendChild(b); });
    if (st.topics.length < 6) {
      var sel = el('select', 'cmp_add'); sel.appendChild(el('option', '', '+ topic')); sel.firstChild.value = '';
      D.topics.filter(function (t) { return st.topics.indexOf(t.id) < 0; }).sort(function (a, b) { return a.label < b.label ? -1 : 1; }).forEach(function (t) { var o = el('option', '', t.label); o.value = t.id; sel.appendChild(o); });
      sel.onchange = function () { if (sel.value) go(st.topics.concat(sel.value)); };
      row.appendChild(sel);
    }
  }
  window.CompareInit = function () {
    loading = loading || fetch('data/topic_series.json').then(function (r) { return r.json(); }).then(function (d) { d.byId = {}; d.topics.forEach(function (t) { d.byId[t.id] = t; }); D = d; });
    loading.then(draw).catch(function () { document.getElementById('cmp').textContent = 'The comparison data could not be loaded. Try again.'; loading = null; });
  };
  addEventListener('resize', function () { if (D && location.hash.indexOf('#/compare') === 0) draw(); });
})();
