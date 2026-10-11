(function () {
  'use strict';
  // Today's story (#181): the story finder's daily pick, page at #/s/<date>. Numbers come from data/finder/<date>.json only.
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function S(t, a) { var e = document.createElementNS('http://www.w3.org/2000/svg', t); for (var k in a) e.setAttribute(k, a[k]); return e; }
  var pct = function (v) { return (v < 0.001 ? (v * 100).toFixed(3) : v < 0.01 ? (v * 100).toFixed(2) : (v * 100).toFixed(1)) + '%'; };
  function step(root, label, node) { var s = el('section', 'fstep'); s.appendChild(el('h3', 'fk', label)); s.appendChild(node); root.appendChild(s); }
  function line(series, months, rows) {
    var W = 320, H = 120, pl = 4, pt = 8, pb = 16, n = series.length, sm = series.map(function (_, i) { var a = series.slice(Math.max(0, i - 5), i + 1); return a.reduce(function (u, w) { return u + w; }, 0) / a.length; });
    var mx = Math.max.apply(null, sm) || 1, X = function (i) { return pl + (W - 2 * pl) * i / (n - 1); }, Y = function (v) { return pt + (H - pt - pb) * (1 - v / mx); };
    var s = S('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Monthly share of story titles, ' + months[0] + ' to ' + months[n - 1] + ', 6-month average. Peak ' + (mx * 100).toFixed(2) + '%.' });
    rows.forEach(function (r, k) { var a = months.indexOf(r.from), b = months.indexOf(r.to); if (a < 0 || b < 0 || k > 0) return; s.appendChild(S('rect', { x: X(a), y: pt, width: Math.max(2, X(b) - X(a)), height: H - pt - pb, class: 'ctx-band' })); });
    s.appendChild(S('path', { d: sm.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(''), class: 'ctx-line', fill: 'none' }));
    [['start', months[0].slice(0, 4), pl], ['end', months[n - 1].slice(0, 4), W - pl]].forEach(function (t) { var e = S('text', { x: t[2], y: H - 3, 'text-anchor': t[0], class: 'g-lab' }); e.textContent = t[1]; s.appendChild(e); });
    return s;
  }
  window.TodayInit = function (date) {
    var root = document.getElementById('today_body'); root.replaceChildren(el('div', 'skel'));
    Promise.all([fetch('data/finder/' + date + '.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }), fetch('data/topic_series.json').then(function (r) { return r.json(); }).catch(function () { return null; })]).then(function (res) {
      var e = res[0], ts = res[1], st = e.story; root.replaceChildren();
      root.appendChild(el('p', 'fk', 'Today\u2019s story \u00b7 ' + date));
      root.appendChild(el('h2', 'f_h', st.headline));
      var ul = el('ul', 'f_rows');
      st.rows.forEach(function (r) { var li = el('li'); li.appendChild(el('b', '', pct(r.share))); li.appendChild(el('span', '', ' ' + r.label + ' (' + r.from + ' to ' + r.to + (r.n != null ? ', ' + r.n.toLocaleString('en-US') + ' of ' + r.total.toLocaleString('en-US') + ' stories' : '') + ')')); ul.appendChild(li); });
      step(root, 'What we saw', ul);
      var t = ts && ts.topics.filter(function (x) { return x.id === e.term; })[0];
      if (t) { var box = el('div', 'ctx'); box.appendChild(line(t.series, ts.months, st.rows)); box.appendChild(el('p', 'ctx-note', 'Monthly share of story titles for ' + t.label + ', 6-month average, ' + ts.months[0] + ' to ' + ts.months[ts.months.length - 1] + '. The shaded band is the latest window.')); step(root, 'The line', box); }
      step(root, 'Takeaway', el('p', 'take', st.takeaway));
      if (st.tracked) { var tk = el('p', '', st.tracked + ' '); var ta = el('a', '', 'Open the card'); ta.href = '#/c/' + e.card_id + '/all'; tk.appendChild(ta); step(root, 'On the scoreboard', tk); }
      step(root, 'Keep in mind', el('p', '', st.limit));
      var how = el('p', '', 'Found by the story finder: ' + e.generator.replace('_', '-') + ' on ' + date + '. '); if (e.dictionary) { var a = el('a', '', 'See the word list and sample titles'); a.href = e.dictionary; how.appendChild(a); how.appendChild(document.createTextNode('.')); }
      step(root, 'How it was found', how);
      window.SetPageMeta && window.SetPageMeta(st.headline, st.opening);
    }).catch(function () { root.textContent = 'There is no story for this date.'; });
  };
  // the one-line entry on the home page. The first load asks the chart to redraw once, so it is sized with the line in place.
  var latest;
  function put(host, l) { var a = el('a', 'today_line'); a.href = '#/s/' + l.date; a.appendChild(el('b', '', 'Today\u2019s story ')); a.appendChild(document.createTextNode(l.headline)); host.appendChild(a); }
  window.TodayLine = function (host) {
    if (latest !== undefined) { if (latest) put(host, latest); return; }
    fetch('data/finder/latest.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (l) { latest = l; dispatchEvent(new Event('resize')); }).catch(function () { latest = null; });
  };
})();
