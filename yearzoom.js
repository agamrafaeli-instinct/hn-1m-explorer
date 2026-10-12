(function (root) {
  'use strict';
  // Shared year-range control for line charts (#206, spec in docs/YEAR_ZOOM.md). All years is the default; a range is the reader's choice.
  function parse(text, min, max) {
    var all = { from: min, to: max, all: true };
    if (text == null || text === '' || text === 'all') return all;
    var m = /^(\d{4})(?:-(\d{4}))?$/.exec(String(text).trim());
    if (!m) return all;
    var a = +m[1], b = m[2] ? +m[2] : a;
    if (a > b || b < min || a > max) return all;
    a = Math.max(a, min); b = Math.min(b, max);
    return { from: a, to: b, all: a === min && b === max };
  }
  function text(r) { return r.all ? 'all' : r.from === r.to ? String(r.from) : r.from + '-' + r.to; }
  function label(r, min, max) { return r.all ? 'All years, ' + min + ' to ' + max : r.from === r.to ? String(r.from) : r.from + ' to ' + r.to; }
  function fromHash(hash, min, max) {
    var q = String(hash || '').split('?')[1] || '', m = /(?:^|&)years=([^&]*)/.exec(q);
    return parse(m ? decodeURIComponent(m[1]) : '', min, max);
  }
  function withHash(hash, r) {
    var p = String(hash || '#/').split('?'), rest = (p[1] || '').split('&').filter(function (x) { return x && !/^years=/.test(x); });
    if (!r.all) rest.push('years=' + text(r));
    return p[0] + (rest.length ? '?' + rest.join('&') : '');
  }
  // Indices of 'YYYY-MM' labels that fall inside the range.
  function pick(months, r) { var out = []; months.forEach(function (m, i) { var y = +String(m).slice(0, 4); if (y >= r.from && y <= r.to) out.push(i); }); return out; }
  function mount(box, o) {
    var min = o.min, max = o.max, cur = fromHash(location.hash, min, max), listeners = [];
    function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
    var wrap = el('div', 'yz'), a = el('select'), b = el('select'), row = el('div', 'yz_p'), say = el('p', 'yz_l'), btns = {};
    wrap.setAttribute('role', 'group'); wrap.setAttribute('aria-label', 'Years shown in the line charts');
    a.setAttribute('aria-label', 'First year'); b.setAttribute('aria-label', 'Last year');
    for (var y = min; y <= max; y++) { a.add(new Option(y, y)); b.add(new Option(y, y)); }
    var sel = el('div', 'yz_s'); sel.appendChild(a); sel.appendChild(el('span', null, 'to')); sel.appendChild(b);
    [['all', 'All years', function () { return { from: min, to: max, all: true }; }],
     ['5', 'Last 5 years', function () { return { from: max - 4, to: max, all: false }; }],
     ['10', 'Last 10 years', function () { return { from: max - 9, to: max, all: false }; }],
     ['reset', 'Reset', function () { return { from: min, to: max, all: true }; }]].forEach(function (p) {
      var bt = el('button', 'yz_b', p[1]); bt.type = 'button'; btns[p[0]] = bt; bt.onclick = function () { set(p[2]()); }; row.appendChild(bt);
    });
    wrap.appendChild(sel); wrap.appendChild(row); wrap.appendChild(say); box.appendChild(wrap);
    function draw() {
      a.value = cur.from; b.value = cur.to; say.textContent = label(cur, min, max);
      btns.all.setAttribute('aria-pressed', cur.all); btns['5'].setAttribute('aria-pressed', !cur.all && cur.to === max && cur.from === max - 4);
      btns['10'].setAttribute('aria-pressed', !cur.all && cur.to === max && cur.from === max - 9);
    }
    function set(r) {
      cur = r; draw();
      if (history.replaceState) history.replaceState(null, '', withHash(location.hash, r));
      listeners.forEach(function (f) { f(cur); });
    }
    function fromSelects() { var x = +a.value, z = +b.value; if (x > z) { if (this === a) z = x; else x = z; } set({ from: x, to: z, all: x === min && z === max }); }
    a.onchange = b.onchange = fromSelects;
    draw();
    return { get: function () { return cur; }, on: function (f, quiet) { listeners.push(f); if (!quiet) f(cur); }, label: function () { return label(cur, min, max); } };
  }
  var COLOR = '#b84700';
  function S(t, a) { var e = document.createElementNS('http://www.w3.org/2000/svg', t); for (var k in a) e.setAttribute(k, a[k]); return e; }
  function fmt(n) { return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'k' : String(n); }
  function chart(rows, label, unit) {
    var W = 320, H = 150, pl = 8, pr = 46, pt = 10, pb = 22, n = rows.length;
    var mx = Math.max.apply(null, rows.map(function (r) { return r[1]; }).concat([1]));
    var X = function (i) { return pl + (W - pl - pr) * (n > 1 ? i / (n - 1) : 0); }, Y = function (v) { return pt + (H - pt - pb) * (1 - v / mx); };
    var s = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'lens_svg', role: 'img', 'aria-label': label + ', ' + unit + ', ' + rows[0][0] + ' to ' + rows[n - 1][0] + ', latest ' + rows[n - 1][1] });
    s.appendChild(S('path', { d: rows.map(function (r, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(r[1]).toFixed(1); }).join(''), fill: 'none', stroke: COLOR, 'stroke-width': 2, 'stroke-linejoin': 'round' }));
    var t = S('text', { x: X(n - 1) + 5, y: Y(rows[n - 1][1]) + 4, class: 'lens_lab', fill: COLOR, 'font-weight': 700 }); t.textContent = fmt(rows[n - 1][1]); s.appendChild(t);
    var pk = S('text', { x: pl, y: pt + 8, class: 'lens_lab' }); pk.textContent = 'top ' + fmt(mx); s.appendChild(pk);
    [[0, 'start', rows[0][0]], [n - 1, 'end', rows[n - 1][0]]].forEach(function (p) { var q = S('text', { x: p[1] === 'start' ? pl : W - pr + 8, y: H - 4, 'text-anchor': p[1] === 'start' ? 'start' : 'end', class: 'lens_lab' }); q.textContent = p[2]; s.appendChild(q); });
    return s;
  }
  var api = { chart: chart, parse: parse, text: text, label: label, fromHash: fromHash, withHash: withHash, pick: pick, mount: mount };
  if (typeof module !== 'undefined') module.exports = api; else root.YearZoom = api;
})(typeof window !== 'undefined' ? window : globalThis);
