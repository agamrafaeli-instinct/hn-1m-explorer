(function () {
  'use strict';
  // Rings view (#274, docs/RINGS_SPEC.md): what the title words, domains and story types of each year looked like, 2006 to now.
  // The same component is used by #/rings and by the home essay. It shows numbers and does not say whether taste drifts or repeats.
  var D = null, loading = null;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function load() { return loading || (loading = fetch('data/rings.json').then(function (r) { if (!r.ok) throw new Error('rings.json ' + r.status); return r.json(); }).then(function (d) { D = d; return d; })); }
  function pct(v) { return (v * 100 < 1 ? (v * 100).toFixed(2) : (v * 100).toFixed(1)) + '%'; }
  function heat(d) {
    var wrap = el('div', 'rg_heat'), head = el('div', 'rg_row rg_head'); head.appendChild(el('span', 'rg_y', ''));
    d.themes.forEach(function (t) { var s = el('span', 'rg_h'); s.appendChild(el('b', null, t.label)); head.appendChild(s); });
    wrap.appendChild(head);
    var max = d.themes.map(function (t) { return Math.max.apply(null, t.share) || 1; });
    d.years.forEach(function (y, i) {
      var row = el('div', 'rg_row'); row.appendChild(el('span', 'rg_y', String(y)));
      d.themes.forEach(function (t, j) {
        var c = el('span', 'rg_c'), v = t.share[i], k = v / max[j];
        c.style.background = 'rgba(255,102,0,' + (k * 0.9).toFixed(2) + ')';
        var tip = y + ', ' + t.label + ': ' + pct(v) + ' of stories (' + Math.round(k * 100) + '% of this theme\'s highest year)';
        c.title = tip; c.setAttribute('aria-label', tip); row.appendChild(c);
      });
      wrap.appendChild(row);
    });
    return wrap;
  }
  function domains(d) {
    var ul = el('div', 'rg_dom');
    d.years.forEach(function (y, i) {
      var r = el('p', 'rg_dr'); r.appendChild(el('b', null, y + ' '));
      r.appendChild(document.createTextNode(d.domains[i].slice(0, 3).map(function (x) { return x[0]; }).join(', ') || 'no domain data'));
      ul.appendChild(r);
    });
    return ul;
  }
  function types(d) {
    var t = d.types, tb = el('div', 'rg_ty'), head = el('div', 'rg_tr rg_th');
    ['', 'Show HN', 'Questions', 'Comments per story'].forEach(function (x) { head.appendChild(el('span', null, x)); });
    tb.appendChild(head);
    d.years.forEach(function (y, i) {
      var r = el('div', 'rg_tr');
      [String(y), pct(t.show_hn_share[i]), pct(t.question_share[i]), t.comments_per_story[i].toFixed(1)].forEach(function (x) { r.appendChild(el('span', null, x)); });
      tb.appendChild(r);
    });
    return tb;
  }
  function sec(h, p, node) { var s = el('section', 'rg_sec'); s.appendChild(el('h3', null, h)); s.appendChild(el('p', 'rg_note', p)); s.appendChild(node); return s; }
  function mount(box) {
    box.replaceChildren(el('p', 'rg_note', 'Loading the years...'));
    return load().then(function (d) {
      box.replaceChildren(
        sec('Themes by year', 'Each column is a theme. Darker means a bigger share of that year\'s stories with the theme in the title, compared with the theme\'s own highest year. Each cell carries its number as a label.', heat(d)),
        sec('Top domains by year', 'The three domains with the most front-page appearances in each year (sum of the monthly top lists).', domains(d)),
        sec('Story types by year', 'Show HN and question headlines as a share of stories, and comments per story.', types(d)),
        el('p', 'rg_note', d.note + ' Source: data/film_shares.json, data/atlas/tops-YYYY.json, data/atlas/months.json.'));
    }).catch(function (e) { box.replaceChildren(el('p', 'rg_note', 'Could not load the yearly data: ' + e.message)); });
  }
  window.Rings = { mount: mount };
  window.RingsInit = function () { if (window.SetPageMeta) window.SetPageMeta('What HN rewarded, year by year', 'Themes, domains and story types of every year of Hacker News since 2006, from the full archive.'); var b = document.getElementById('rings_body'); if (b) mount(b); };
})();
