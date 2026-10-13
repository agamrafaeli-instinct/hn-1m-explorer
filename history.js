(function () {
  'use strict';
  // Full history on the Explorer page (#119). Reads only data/atlas (docs/ARCHITECTURE_ATLAS.md, slice 7a): months.json first, then one terms file or one tops file when asked.
  var jc = {}, M, rng = { from: 0, to: 9999, all: true }, onZoom = [], ZL = '';
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function get(u) { return jc[u] || (jc[u] = fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })); }
  function counted() { return M.months.filter(function (m) { var y = +m.month.slice(0, 4); return (m.stories || m.comments) && y >= rng.from && y <= rng.to; }); }
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
        function draw() {
          out.replaceChildren();
          var rows = counted().map(function (m) { return [m.month, t[m.month] || 0]; });
          out.appendChild(el('p', 'wsh', 'Stories a month with "' + w + '" in the title, ' + ZL));
          if (rows.length) out.appendChild(YearZoom.chart(rows, w, 'stories per month')); else out.appendChild(el('p', 'wn', 'No data for these years.'));
        }
        draw(); onZoom.length = 0; onZoom.push(draw);
      }).catch(function () { out.textContent = 'Could not load this word. Try again.'; });
    };
  }
  function load(src, ok) { if (window.YearZoom) return ok(); var sc = document.createElement('script'); sc.src = src; sc.onload = ok; document.head.appendChild(sc); }
  function rowBlock(root) {
    var box = el('div'); root.appendChild(el('h3', 'fk', 'Find stories, all years')); root.appendChild(el('p', 'wsh', 'Title words (a space means AND), domain, score and dates, over every year of stories. The search engine loads only when you search.'));
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
        out.appendChild(el('p', 'wn', 'Top stories by score. Archive scores were saved when the story was fetched, so they are low for 2023 and 2026.'));
        var ul = el('ul', 'lens_top'); x.top_stories.slice(0, 10).forEach(function (s) { var li = el('li'), a = el('a', null, s[1]); a.href = 'https://news.ycombinator.com/item?id=' + s[0]; a.rel = 'noopener'; li.appendChild(a); li.appendChild(el('span', 'wn', s[2] + ' points')); ul.appendChild(li); });
        out.appendChild(ul);
      }).catch(function () { out.textContent = 'Could not load this month. Try again.'; });
    }
    i.onchange = show; show();
  }
  window.HistInit = function () {
    var root = document.getElementById('hist_body'); if (!root || root.dataset.done) return; root.dataset.done = '1';
    root.replaceChildren(el('div', 'skel wsk'));
    get('data/atlas/months.json').then(function (d) {
      M = d; root.replaceChildren();
      var zbox = el('div'), cbox = el('div'); root.appendChild(zbox); root.appendChild(cbox);
      var ys = M.months.filter(function (m) { return m.stories || m.comments; }).map(function (m) { return +m.month.slice(0, 4); });
      load('yearzoom.js', function () {
        var Z = YearZoom.mount(zbox, { min: ys[0], max: ys[ys.length - 1] });
        Z.on(function (r) {
          rng = r; ZL = Z.label(); var c = counted();
          cbox.replaceChildren();
          if (!c.length) { cbox.appendChild(el('p', 'wn', 'No data for these years.')); } else {
            cbox.appendChild(el('p', 'wsh', 'Stories a month, ' + ZL));
            cbox.appendChild(YearZoom.chart(series('stories'), 'Stories', 'stories per month'));
            cbox.appendChild(el('p', 'wsh', 'Comments a month, ' + ZL));
            cbox.appendChild(YearZoom.chart(series('comments'), 'Comments', 'comments per month'));
          }
          onZoom.forEach(function (f) { f(); });
        });
      });
      termBlock(root); monthBlock(root); rowBlock(root);
      root.appendChild(el('p', 'wn wfoot', 'Source: the archive in data/archive and the daily counts in data/history, ' + (ys.length ? M.months.filter(function (m) { return m.stories || m.comments; })[0].month + ' to ' + M.months.filter(function (m) { return m.stories || m.comments; }).slice(-1)[0].month + '. ' : '') + M.note));
    }).catch(function () { root.textContent = 'Could not load the history files. Try again.'; });
  };
})();
