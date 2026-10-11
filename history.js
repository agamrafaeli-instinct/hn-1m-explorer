(function () {
  'use strict';
  // Full history on the Explorer page (#119). Reads only data/atlas (docs/ARCHITECTURE_ATLAS.md, slice 7a): months.json first, then one terms file or one tops file when asked.
  var jc = {}, M, COLOR = '#b84700';
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function S(t, a) { var e = document.createElementNS('http://www.w3.org/2000/svg', t); for (var k in a) e.setAttribute(k, a[k]); return e; }
  function get(u) { return jc[u] || (jc[u] = fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })); }
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
  function counted() { return M.months.filter(function (m) { return m.stories || m.comments; }); }
  function series(key) { return counted().map(function (m) { return [m.month, m[key] || 0]; }); }
  function termBlock(root) {
    var f = el('form', 'hist_f'), i = el('input'), b = el('button', 'cta', 'Show'), out = el('div');
    i.type = 'search'; i.placeholder = 'A title word, e.g. rust'; i.setAttribute('aria-label', 'Word in story titles'); i.autocomplete = 'off';
    f.appendChild(i); f.appendChild(b); root.appendChild(el('h3', 'fk', 'One word, all years')); root.appendChild(f); root.appendChild(out);
    f.onsubmit = function (e) {
      e.preventDefault(); var w = i.value.trim().toLowerCase(); if (!w) return;
      var k = /^[a-z0-9]/.test(w) ? w[0] : '_'; out.replaceChildren(el('div', 'skel wsk'));
      get('data/atlas/terms-' + k + '.json').then(function (d) {
        var t = d.terms[w]; out.replaceChildren();
        if (!t) { out.appendChild(el('p', 'wn', '"' + w + '" is not one of the 20,000 most used title words in the archive, so it has no series here.')); return; }
        out.appendChild(el('p', 'wsh', 'Stories a month with "' + w + '" in the title'));
        out.appendChild(chart(counted().map(function (m) { return [m.month, t[m.month] || 0]; }), w, 'stories per month'));
      }).catch(function () { out.textContent = 'Could not load this word. Try again.'; });
    };
  }
  function rowBlock(root) {
    var box = el('div'); root.appendChild(el('h3', 'fk', 'Find stories, all years')); root.appendChild(el('p', 'wsh', 'Title words, domain, score and dates, over every year of stories. The search engine loads only when you search.'));
    root.appendChild(box);
    var sc = document.createElement('script'); sc.src = 'rowsearch.js'; sc.onload = function () { window.RowSearch(box); }; document.head.appendChild(sc);
  }
  function monthBlock(root) {
    var f = el('div', 'hist_f'), i = el('input'), out = el('div'), last = M.range[1];
    i.type = 'month'; i.min = M.range[0]; i.max = last; i.value = last; i.setAttribute('aria-label', 'Month');
    f.appendChild(i); root.appendChild(el('h3', 'fk', 'Any month')); root.appendChild(f); root.appendChild(out);
    function show() {
      var m = i.value; if (!m) return; out.replaceChildren(el('div', 'skel wsk'));
      get('data/atlas/tops-' + m.slice(0, 4) + '.json').then(function (d) {
        var x = d.months[m]; out.replaceChildren(); if (!x) { out.appendChild(el('p', 'wn', 'No stories in the archive for this month.')); return; }
        out.appendChild(el('p', 'wsh', 'Sites with the most stories in ' + m + ': ' + x.top_domains.slice(0, 8).map(function (r) { return r[0] + ' ' + r[1]; }).join(', ') + '.'));
        out.appendChild(el('p', 'wn', 'Top stories by score. Archive scores were saved when the story was fetched, so they are low for 2025 and 2026.'));
        var ul = el('ul', 'lens_top'); x.top_stories.slice(0, 10).forEach(function (s) { var li = el('li'), a = el('a', null, s[1]); a.href = 'https://news.ycombinator.com/item?id=' + s[0]; a.rel = 'noopener'; li.appendChild(a); li.appendChild(el('span', 'wn', s[2] + ' points')); ul.appendChild(li); });
        out.appendChild(ul);
      }).catch(function () { out.textContent = 'Could not load this month.'; });
    }
    i.onchange = show; show();
  }
  window.HistInit = function () {
    var root = document.getElementById('hist_body'); if (!root || root.dataset.done) return; root.dataset.done = '1';
    root.replaceChildren(el('div', 'skel wsk'));
    get('data/atlas/months.json').then(function (d) {
      M = d; root.replaceChildren();
      root.appendChild(el('p', 'wsh', 'Stories a month, ' + counted()[0].month + ' to ' + counted().slice(-1)[0].month));
      root.appendChild(chart(series('stories'), 'Stories', 'stories per month'));
      root.appendChild(el('p', 'wsh', 'Comments a month'));
      root.appendChild(chart(series('comments'), 'Comments', 'comments per month'));
      termBlock(root); monthBlock(root); rowBlock(root);
      root.appendChild(el('p', 'wn wfoot', 'From the archive in data/archive and the daily counts in data/history. ' + M.note));
    }).catch(function () { root.textContent = 'Could not load the history files.'; });
  };
})();
