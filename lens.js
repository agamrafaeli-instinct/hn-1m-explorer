(function () {
  'use strict';
  // Lens (#193): one domain or one watchlist name across the saved weeks. #/l/<domain> or #/l/n/<name>.
  // Loads data/lens/<id>.json only (docs/LENS_SPEC.md). Under 8 a week is too small to count and shows as words.
  var FLOOR = 8, jc = {};
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function S(t, a) { var e = document.createElementNS('http://www.w3.org/2000/svg', t); for (var k in a) e.setAttribute(k, a[k]); return e; }
  function slug(n) { return n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function get(u) { return jc[u] || (jc[u] = fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })); }
  function word(e, r) {
    var v = e.kind === 'domain' ? r.stories : r.mentions;
    if (v == null) return e.kind === 'domain' ? 'under 3' : 'no data';
    if (v === 0) return 'none';
    return v < FLOOR ? 'seen' : String(v);
  }
  function chart(e) {
    var W = 320, H = 150, pl = 8, pr = 54, pt = 10, pb = 22, rows = e.weeks, n = rows.length;
    var val = function (r) { var v = e.kind === 'domain' ? r.stories : r.mentions; return v != null && v >= FLOOR ? v : null; };
    var vs = rows.map(val), mx = Math.max.apply(null, vs.filter(function (v) { return v != null; }).concat([1]));
    var X = function (i) { return pl + (W - pl - pr) * (n > 1 ? i / (n - 1) : 0); }, Y = function (v) { return pt + (H - pt - pb) * (1 - v / mx); };
    var unit = e.kind === 'domain' ? 'stories per week' : 'stories per week that mention it';
    var s = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'lens_svg', role: 'img', 'aria-label': e.label + ', ' + unit + ', ' + rows[0].week + ' to ' + rows[n - 1].week + '. Weeks under ' + FLOOR + ' are left blank.' });
    var d = '', pen = false;
    vs.forEach(function (v, i) { if (v == null) { pen = false; return; } d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); pen = true; });
    s.appendChild(S('path', { d: d, fill: 'none', stroke: '#b84700', 'stroke-width': 2.2, 'stroke-linejoin': 'round' }));
    vs.forEach(function (v, i) { if (v != null) s.appendChild(S('circle', { cx: X(i), cy: Y(v), r: 3, fill: '#b84700' })); });
    var last = -1; vs.forEach(function (v, i) { if (v != null) last = i; });
    if (last >= 0) { var t = S('text', { x: X(last) + 6, y: Y(vs[last]) + 4, class: 'lens_lab', fill: '#b84700', 'font-weight': 700 }); t.textContent = vs[last]; s.appendChild(t); }
    [[0, 'start'], [n - 1, 'end']].forEach(function (p) { var t = S('text', { x: p[1] === 'start' ? pl : W - pr + 8, y: H - 4, 'text-anchor': p[1] === 'start' ? 'start' : 'end', class: 'lens_lab' }); t.textContent = rows[p[0]].week.slice(5); s.appendChild(t); });
    return s;
  }
  function render(e, root) {
    root.replaceChildren();
    root.appendChild(el('h1', 'lens_h', e.label));
    var seen = e.weeks.length;
    root.appendChild(el('p', 'wn', seen + ' saved weeks' + (e.first_seen ? ', first seen in ' + e.first_seen : ', not seen yet') + '. ' + (e.kind === 'domain' ? 'Stories per week linking to this site.' : 'Stories per week whose title or text mention this name.')));
    root.appendChild(chart(e));
    var ul = el('ul', 'lens_wk');
    e.weeks.forEach(function (r) { var li = el('li'); li.appendChild(el('span', null, r.week + (r.backfill ? ' *' : ''))); li.appendChild(el('b', null, word(e, r) + (e.kind === 'domain' && r.points != null && r.stories >= FLOOR ? ' \u00b7 ' + r.points.toLocaleString() + ' points' : ''))); ul.appendChild(li); });
    root.appendChild(ul);
    if (e.top_stories && e.top_stories.length) {
      root.appendChild(el('h3', 'fk', 'Top stories in the saved weeks'));
      var tl = el('ul', 'lens_top');
      e.top_stories.forEach(function (s) { var li = el('li'), a = el('a', null, s.title); a.href = 'https://news.ycombinator.com/item?id=' + s.id; a.rel = 'noopener'; li.appendChild(a); li.appendChild(el('span', 'wn', s.week + ' \u00b7 ' + s.points.toLocaleString() + ' points \u00b7 ' + s.comments.toLocaleString() + ' comments')); tl.appendChild(li); });
      root.appendChild(tl);
    }
    if (e.weeks.length) root.appendChild(el('p', 'src rg_fine', 'Source: the saved weekly snapshots of Hacker News, ' + e.weeks[0].week + ' to ' + e.weeks[e.weeks.length - 1].week + ' (' + e.weeks.length + ' weeks).'));
    var c = 'Hacker News talking, not a measure of what is true. Under ' + FLOOR + ' a week is too small to count, so it shows as seen or none' + (e.kind === 'domain' ? ', and a site missing from a week had under 3 stories' : '') + '. Counts use stories only. ' + (e.kind === 'name' ? 'A match is a word list match on titles and text and does not say who is talking or why. ' : '') + 'Only the ' + seen + ' saved weeks are shown.' + (e.weeks.some(function (r) { return r.backfill; }) ? ' * Rebuilt from the archive after the week ended.' : '');
    root.appendChild(el('p', 'wn wfoot', c));
  }
  window.LensInit = function (a, b) {
    var root = document.getElementById('lens_body'), id = a === 'n' ? 'n-' + slug(decodeURIComponent(b || '')) : decodeURIComponent(a || '');
    root.replaceChildren(el('div', 'skel wsk'));
    if (!/^[A-Za-z0-9.\-]+$/.test(id)) { root.textContent = 'No page for this one.'; return; }
    get('data/lens/' + id + '.json').then(function (e) { render(e, root); window.SetPageMeta && window.SetPageMeta(e.label + ': saved weeks', e.label + ' across the saved weeks of Hacker News.'); scrollTo({ top: 0, behavior: 'instant' }); })
      .catch(function () { root.textContent = 'No page for this one. Pages exist for sites seen in 3 or more saved weeks and for the watchlist names.'; });
  };
})();
