(function () {
  'use strict';
  // Rings view (#274, #275): themes, domains and story types of each year, 2006 to now, as pictures with a pop-up for the numbers.
  // Neutral on purpose: it shows numbers and does not say whether taste drifts or repeats (docs/RINGS_SPEC.md).
  var D = null, loading = null, pop = null, pinned = null;
  // Small line pictograms, drawn here so they render on every phone. Each is the inside of a 24 x 24 svg.
  var ICON = {
    python: '<rect x="3" y="3" width="11" height="11" rx="4"/><rect x="10" y="10" width="11" height="11" rx="4"/>',
    react: '<ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
    rust: '<circle cx="12" cy="12" r="5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    kubernetes: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 3v7M12 14v7M3 12h7M14 12h7M5.6 5.6l4.9 4.9M13.5 13.5l4.9 4.9M18.4 5.6l-4.9 4.9M10.5 13.5l-4.9 4.9"/>',
    llm: '<path d="M4 4h16v12H9l-5 4z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/>',
    vcgpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    cu_space: '<circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="10" ry="3" transform="rotate(-25 12 12)"/>',
    cu_games: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10v5M4.5 12.5h5M16 11h.01M18 14h.01"/>',
    cu_privacy: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    cu_health: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
    gk_history: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    gk_science: '<path d="M9 3h6M10 3v6l-6 10a2 2 0 002 3h12a2 2 0 002-3l-6-10V3"/>',
    show: '<path d="M3 10v4h4l8 5V5L7 10z"/><path d="M18 9a4 4 0 010 6"/>',
    ask: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 115 0c0 2-2.5 2-2.5 4M12 17h.01"/>',
    talk: '<path d="M4 4h16v12H9l-5 4z"/>'
  };
  function icon(k) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'rg_ic');
    s.setAttribute('aria-hidden', 'true'); s.innerHTML = ICON[k] || ''; return s;
  }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function load() { return loading || (loading = fetch('data/rings.json').then(function (r) { if (!r.ok) throw new Error('rings.json ' + r.status); return r.json(); }).then(function (d) { D = d; return d; })); }
  function pct(v) { return (v * 100 < 1 ? (v * 100).toFixed(2) : (v * 100).toFixed(1)) + '%'; }
  function hue(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }
  // One pop-up for the whole view. Hover shows it, a tap or click pins it, a tap elsewhere closes it.
  function popup() {
    if (!pop) { pop = el('div', 'rg_pop'); pop.setAttribute('role', 'status'); pop.hidden = true; document.body.appendChild(pop);
      addEventListener('scroll', function () { pinned = null; pop.hidden = true; }, { passive: true });
      document.addEventListener('click', function (e) { if (!e.target.closest || !e.target.closest('[data-tip]')) { pinned = null; pop.hidden = true; } }); }
    return pop;
  }
  function place(t) {
    var p = popup(), r = t.getBoundingClientRect(), w = Math.min(260, innerWidth - 16);
    p.style.width = w + 'px'; p.hidden = false;
    var left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)), top = r.top - p.offsetHeight - 8;
    if (top < 8) top = r.bottom + 8;
    p.style.left = left + 'px'; p.style.top = top + 'px';
  }
  function show(t) { popup().textContent = t.dataset.tip; place(t); }
  function wire(root) {
    root.addEventListener('mouseover', function (e) { var t = e.target.closest('[data-tip]'); if (t && !pinned) show(t); });
    root.addEventListener('mouseout', function (e) { if (!pinned && e.target.closest('[data-tip]')) popup().hidden = true; });
    root.addEventListener('click', function (e) { var t = e.target.closest('[data-tip]'); if (!t) return; e.stopPropagation(); pinned = t; show(t); });
    root.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset && e.target.dataset.tip) { e.preventDefault(); pinned = e.target; show(e.target); } });
  }
  function tipEl(tag, cls, text, tip, ic) { var e = el(tag, cls, text); if (ic) e.appendChild(icon(ic)); e.dataset.tip = tip; e.setAttribute('aria-label', tip); return e; }
  function heat(d) {
    var wrap = el('div', 'rg_heat'), head = el('div', 'rg_row rg_head'); head.appendChild(el('span', 'rg_y', ''));
    d.themes.forEach(function (t) { head.appendChild(tipEl('span', 'rg_h t_' + t.id, '', (t.terms === t.label ? t.label : t.label + ': ' + t.terms), t.id)); });
    wrap.appendChild(head);
    var max = d.themes.map(function (t) { return Math.max.apply(null, t.share) || 1; });
    d.years.forEach(function (y, i) {
      var row = el('div', 'rg_row'); row.appendChild(el('span', 'rg_y', String(y)));
      d.themes.forEach(function (t, j) {
        var v = t.share[i], k = v / max[j];
        var c = tipEl('span', 'rg_c', '', y + ' ' + t.label + ': ' + pct(v) + ' of story titles, ' + Math.round(k * 100) + '% of its highest year');
        c.classList.add('t_' + t.id); c.style.background = 'rgba(255,102,0,' + (k * 0.9).toFixed(2) + ')'; row.appendChild(c);
      });
      wrap.appendChild(row);
    });
    return wrap;
  }
  var QS = [
    { q: 'What came out of nowhere?', ids: ['llm', 'rust'] },
    { q: 'What rises and falls, and what stays?', ids: ['react', 'kubernetes', 'python', 'cu_space', 'gk_history', 'cu_games', 'gk_science'] }
  ];
  function facts(d, ids, a) {
    var box = el('div', 'rg_facts');
    ids.forEach(function (id) {
      var t = d.themes.filter(function (x) { return x.id === id; })[0], s = t.share, n = s.length - 1, pk = 0, jump = 1, ji = 1;
      s.forEach(function (v, i) { if (v > s[pk]) pk = i; if (i > 1 && s[i - 1] > 0 && v / s[i - 1] > jump && v > 0.002) { jump = v / s[i - 1]; ji = i; } });
      var txt = t.label + ': peak ' + pct(s[pk]) + ' in ' + d.years[pk] + ', ' + pct(s[n]) + ' in ' + d.years[n] + '.';
      if (a) txt = t.label + ': ' + pct(s[ji - 1]) + ' in ' + d.years[ji - 1] + ', ' + pct(s[ji]) + ' in ' + d.years[ji] + ', ' + pct(s[n]) + ' in ' + d.years[n] + '.';
      box.appendChild(el('p', null, txt));
    });
    return box;
  }
  function questions(d, wrap) {
    var box = el('div', 'rg_qs'), out = el('div', 'rg_qout'), cur = -1;
    QS.forEach(function (Q, qi) {
      var b = el('button', 'rg_q', Q.q); b.type = 'button';
      b.addEventListener('click', function () {
        cur = cur === qi ? -1 : qi;
        Array.prototype.forEach.call(box.children, function (x, i) { x.classList.toggle('on', i === cur); });
        wrap.classList.toggle('rg_dim', cur >= 0);
        wrap.querySelectorAll('.rg_c,.rg_h').forEach(function (c) { c.classList.remove('on'); });
        out.replaceChildren();
        if (cur >= 0) { Q.ids.forEach(function (id) { wrap.querySelectorAll('.t_' + id).forEach(function (c) { c.classList.add('on'); }); }); out.appendChild(facts(d, Q.ids, cur === 0)); }
      });
      box.appendChild(b);
    });
    var all = el('div'); all.appendChild(box); all.appendChild(out); return all;
  }
  function domains(d) {
    var box = el('div', 'rg_dom');
    d.years.forEach(function (y, i) {
      var r = el('div', 'rg_dr'); r.appendChild(el('span', 'rg_y', String(y)));
      var tot = d.stories[i], sum = 0;
      d.domains[i].forEach(function (x) {
        sum += x[1];
        var b = tipEl('span', 'rg_badge', x[0].replace(/^www\./, '').charAt(0).toUpperCase(), y + ' ' + x[0] + ': ' + x[1].toLocaleString('en-US') + ' stories, ' + pct(x[1] / tot) + ' of the year\'s stories');
        b.style.background = 'hsl(' + hue(x[0]) + ',55%,42%)';
        var im = document.createElement('img'); im.alt = ''; im.loading = 'lazy'; im.width = 26; im.height = 26;
        im.src = 'https://www.google.com/s2/favicons?sz=64&domain=' + encodeURIComponent(x[0]);
        im.onerror = function () { im.remove(); }; b.appendChild(im); r.appendChild(b);
      });
      var share = sum / tot, tp = y + ': these ' + d.domains[i].length + ' domains are ' + pct(share) + ' of the year\'s stories. The other ' + pct(1 - share) + ' come from thousands of other sites or have no link.';
      var bar = tipEl('span', 'rg_dbar', '', tp), fill = el('i'); fill.style.width = Math.round(share * 100) + '%'; bar.appendChild(fill); r.appendChild(bar);
      r.appendChild(tipEl('span', 'rg_dsum', Math.round(share * 100) + '%', tp));
      box.appendChild(r);
    });
    return box;
  }
  function strip(label, ik, vals, fmt, years) {
    var row = el('div', 'rg_st'), bars = el('div', 'rg_bars'), mx = Math.max.apply(null, vals) || 1;
    row.appendChild(tipEl('span', 'rg_si', '', label, ik));
    vals.forEach(function (v, i) {
      var b = tipEl('span', 'rg_bar', '', years[i] + ' ' + label + ': ' + fmt(v)); b.style.height = Math.max(2, Math.round(v / mx * 44)) + 'px'; bars.appendChild(b);
    });
    row.appendChild(bars); return row;
  }
  function types(d) {
    var t = d.types, box = el('div', 'rg_ty');
    box.appendChild(strip('Show HN posts, share of stories', 'show', t.show_hn_share, pct, d.years));
    box.appendChild(strip('Question headlines, share of stories', 'ask', t.question_share, pct, d.years));
    box.appendChild(strip('Comments per story', 'talk', t.comments_per_story, function (v) { return v.toFixed(1); }, d.years));
    var ax = el('div', 'rg_ax'); ax.appendChild(el('span', null, String(d.years[0]))); ax.appendChild(el('span', null, String(d.years[d.years.length - 1]))); box.appendChild(ax);
    return box;
  }
  function sec(h, node) { var s = el('section', 'rg_sec'); s.appendChild(el('h3', null, h)); s.appendChild(node); return s; }
  function mount(box) {
    box.replaceChildren(el('p', 'rg_note', 'Loading the years...'));
    return load().then(function (d) {
      box.replaceChildren(el('p', 'rg_note', 'Tap or hover on anything for the number.'), sec('Themes', (function () { var h = heat(d), w = el('div'); w.appendChild(questions(d, h)); w.appendChild(h); return w; })()), sec('Top domains, and their share of all stories', domains(d)), sec('Story types', types(d)),
        el('p', 'rg_note rg_fine', 'Source: titles and domains of every story since 2006. Darker is a bigger share than that theme\'s own average year. Domain counts use each month\'s top 20 sites, and the bar and percent on the right are those sites\' share of all stories that year (orange) against all other stories (grey). Points are not used here, because the archive holds low points for 2023 and 2026.'));
      wire(box);
    }).catch(function (e) { box.replaceChildren(el('p', 'rg_note', 'Could not load the yearly data: ' + e.message)); });
  }
  window.Rings = { mount: mount, tipEl: tipEl, wire: wire, strip: strip, pct: pct };
  window.RingsInit = function () { if (window.SetPageMeta) window.SetPageMeta('What HN rewarded, year by year', 'Themes, domains and story types of every year of Hacker News since 2006, from the full archive.'); var b = document.getElementById('rings_body'); if (b) mount(b); };
})();
