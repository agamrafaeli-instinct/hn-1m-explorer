(function () {
  'use strict';
  // Saga beat 2 (#261): how many stories and how many points per story, each year, from data/saga.json (scripts/saga_data.py).
  var D = null;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function needRings() {
    if (window.Rings) return Promise.resolve();
    return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = 'rings.js'; s.onload = ok; s.onerror = function () { no(new Error('rings.js')); }; document.head.appendChild(s); });
  }
  function bars(label, vals, fmt, years, low, ik) {
    var row = el('div', 'sg_row'), cap = el('p', 'sg_cap'), mx = Math.max.apply(null, vals.filter(function (v, i) { return low.indexOf(years[i]) < 0; })) || 1, box = el('div', 'rg_bars sg_bars');
    cap.appendChild(el('b', null, label)); row.appendChild(cap);
    vals.forEach(function (v, i) {
      var isLow = low.indexOf(years[i]) >= 0, b = window.Rings.tipEl('span', 'rg_bar' + (isLow ? ' sg_low' : ''), '', years[i] + ': ' + fmt(v) + (isLow ? ' (points low in the archive)' : ''));
      b.style.height = Math.max(2, Math.round(Math.min(v, mx) / mx * 64)) + 'px'; box.appendChild(b);
    });
    row.appendChild(box); return row;
  }
  window.SagaInit = function () {
    var fm = document.getElementById('sg_find');
    if (fm && !fm.dataset.on) { fm.dataset.on = '1'; fm.addEventListener('submit', function (e) { e.preventDefault(); var q = document.getElementById('sg_q').value.trim().slice(0, 80); location.hash = '#/explore' + (q ? '?q=' + encodeURIComponent(q) : ''); }); }
    var box = document.getElementById('sg_count'); if (!box || box.dataset.on) return; box.dataset.on = '1';
    Promise.all([fetch('data/saga.json').then(function (r) { if (!r.ok) throw new Error('saga.json ' + r.status); return r.json(); }), needRings()]).then(function (a) {
      D = a[0]; var y = D.years, n = y.length - 1, low = D.low_score_years, f = function (v) { return v.toLocaleString('en-US'); };
      box.replaceChildren(
        bars('Stories each year', D.stories, f, y, [], 'show'),
        bars('Points per story', D.points_per_story, function (v) { return v.toFixed(1); }, y, low, 'show'));
      var ax = el('div', 'rg_ax'); ax.appendChild(el('span', null, String(y[0]))); ax.appendChild(el('span', null, String(y[n]))); box.appendChild(ax);
      box.appendChild(el('p', 'rg_note rg_fine', 'Source: daily counts of every story in the archive, ' + D.first_month + ' to ' + D.last_month + '. 2006 and ' + y[n] + ' are partial years. Hollow bars: the archive holds low points for ' + low.join(' and ') + ', so they are not compared.'));
      window.Rings.wire(box);
      var rb = document.getElementById('sg_rings'); if (rb && !rb.dataset.on) { rb.dataset.on = '1'; window.Rings.mount(rb); }
    }).catch(function (e) { box.textContent = 'Could not load the counts: ' + e.message; });
  };
})();
