(function () {
  'use strict';
  // Compare view (#169 stage 1): one chart, labels on the lines, state in the URL: #/compare?topics=rust,go&measure=share
  var D = null, loading = null;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function S(t, a) { var e = document.createElementNS('http://www.w3.org/2000/svg', t); for (var k in a) e.setAttribute(k, a[k]); return e; }
  var pct = function (v) { return (v < 0.1 ? v.toFixed(3) : v < 1 ? v.toFixed(2) : v.toFixed(1)) + '%'; };
  var COL = ['#ff6600', '#1b1b1b', '#3b7ea1', '#8a6bbf', '#2e8b57', '#b5651d'];
  var evidenceLoad = null, baselineNotice = null;
  function evidence() {
    return evidenceLoad || (evidenceLoad = Promise.all([
      fetch('data/film_shares.json').then(function (r) { if (!r.ok) throw new Error('Source data could not be loaded'); return r.json(); }),
      window.TopicBaseline ? Promise.resolve() : new Promise(function (ok, no) { var sc = document.createElement('script'); sc.src = 'topic-baseline.js'; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); })
    ]).then(function (a) { return a[0]; }).catch(function (err) { evidenceLoad = null; throw err; }));
  }
  var zoomOn = false;
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
  function yrs() { var m = /[?&]years=([^&]*)/.exec(location.hash); return m ? '&years=' + m[1] : ''; }
  function go(ids) { location.hash = '#/compare?topics=' + ids.join(',') + yrs(); }
  function topicId() { var m = location.hash.match(/^#\/t\/([^?\/]+)/); return m && D.byId[m[1]] ? m[1] : null; }
  function smooth(s) { return s.map(function (_, i) { var a = s.slice(Math.max(0, i - 5), i + 1); return a.reduce(function (x, y) { return x + y; }, 0) / a.length * 100; }); }
  function draw() {
    var st = state(), root = document.getElementById('cmp'); root.replaceChildren();
    var baselineSlot = document.getElementById('cmp_baseline'); baselineSlot.hidden = true; baselineSlot.replaceChildren();
    var requested = location.hash.match(/^#\/t\/([^?\/]+)/);
    if (requested && !D.byId[requested[1]]) {
      if (window.SetPageMeta) window.SetPageMeta('Topic not found', 'This topic is not in the current topic list.');
      root.appendChild(el('h2', 'cmp_t', 'Topic not found'));
      root.appendChild(el('p', 'cmp_s', 'This topic is not in the current topic list.'));
      var back = el('a', 'cmp_chip', 'Browse topics'); back.href = '#/topics'; root.appendChild(back);
      document.getElementById('cmp_find').hidden = true;
      document.getElementById('cmp_share').hidden = true;
      return;
    }
    var tops = st.topics.map(function (id) { return D.byId[id]; });
    var home = /^#?\/?(\?.*)?$/.test(location.hash);
    var tid = topicId(); root.classList.toggle('cmp_topic', !!tid);
    if (tid && window.SetPageMeta) window.SetPageMeta(D.byId[tid].label, 'Share of Hacker News story titles matching ' + D.byId[tid].label + ', by month. Title matching only.');
    var sb = document.getElementById('cmp_share'); if (sb) sb.hidden = home || !!tid;
    root.appendChild(el('h2', 'cmp_t', home ? 'How has conversation shifted on HN over time?' : tid ? D.byId[tid].label : 'Share of Hacker News story titles'));
    if (tid) { var browse = el('a', 'cmp_chip cmp_browse', 'Browse topics'); browse.href = '#/topics'; root.appendChild(browse); }
    var first = +D.months[0].slice(0, 4), lastY = +D.months[D.months.length - 1].slice(0, 4), lo = 0, hi = D.months.length - 1, rlabel = '2006 to ' + lastY, zbox = el('div');
    if (window.YearZoom && (zoomOn || /[?&]years=/.test(location.hash))) {
      var r = YearZoom.fromHash(location.hash, first, lastY), ix = YearZoom.pick(D.months, r);
      if (ix.length > 1) { lo = ix[0]; hi = ix[ix.length - 1]; }
      rlabel = r.all ? '2006 to ' + lastY : YearZoom.label(r, first, lastY);
      var Zc = YearZoom.mount(zbox, { min: first, max: lastY }); Zc.on(function () { draw(); }, true);
    } else {
      var zb = el('button', 'cmp_chip', 'Zoom to years'); zb.type = 'button';
      zb.onclick = function () { zb.disabled = true; var sc = document.createElement('script'); sc.src = 'yearzoom.js'; sc.onload = function () { zoomOn = true; draw(); }; document.head.appendChild(sc); };
      zbox.appendChild(zb);
    }
    root.appendChild(el('p', 'cmp_s', 'By month, 6-month average, ' + rlabel + '. Title matching only. ' + (hi === D.months.length - 1 ? 'The shaded band is the latest 12 months. ' : '') + 'The vertical scale is square-root, so small topics stay visible.'));
    root.appendChild(zbox);
    if (home && window.TodayLine) { var tl = el('div', 'today_host'); root.appendChild(tl); window.TodayLine(tl); }
    if (tid) { var t0 = D.byId[tid]; var bd = el('span', 'cmp_badge', t0.pattern + (t0.ratio ? ' \u00b7 ' + (t0.ratio >= 10 ? t0.ratio.toFixed(0) : t0.ratio.toFixed(1)) + 'x the all-earlier share' : '')); root.appendChild(bd); }
    if (tid) { var words = el('p', 'cmp_words'); words.id = 'cmp_words'; words.appendChild(el('b', '', 'Title matching rule')); words.appendChild(el('span', 'cmp_matcher', D.byId[tid].matcher)); words.appendChild(el('small', '', 'Matched against story titles, ignoring case. This is the exact pattern, including word boundaries and word variants.')); var dict = el('a', 'cmp_dict', 'Source dictionary: ' + tid); dict.href = 'https://github.com/agamrafaeli-instinct/hn-1m-explorer/blob/main/data/topic_series.json'; words.appendChild(dict); root.appendChild(words); }
    var box = el('div', 'cmp_box'), row = el('div', 'cmp_row'); root.appendChild(box); root.appendChild(row);
    var W = box.clientWidth || 360, H = box.clientHeight || 360, padL = 34, padR = 112, padT = 14, padB = 22;
    var ser = tops.map(function (t) { return smooth(t.series).slice(lo, hi + 1); }), n = hi - lo + 1, MO = D.months.slice(lo, hi + 1);
    var max = Math.max.apply(null, ser.map(function (s) { return Math.max.apply(null, s); })) * 1.08 || 1;
    var X = function (i) { return padL + (W - padL - padR) * i / (n - 1); }, Y = function (v) { return padT + (H - padT - padB) * (1 - Math.sqrt(Math.max(v, 0) / max)); };
    var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': 'Line chart of title share by month for ' + tops.map(function (t) { return t.label; }).join(', ') });
    if (hi === D.months.length - 1 && n > 12) svg.appendChild(S('rect', { x: X(n - 12), y: padT, width: X(n - 1) - X(n - 12), height: H - padT - padB, fill: '#f1e6d3' }));
    var ticks = [0].concat([0.1, 0.5, 1, 2, 5, 10].filter(function (v) { return v < max * 0.98; })); ticks = ticks.filter(function (v, i) { return i === 0 || Math.abs(Y(v) - Y(ticks[i - 1])) > 22; });
    ticks.forEach(function (v) { svg.appendChild(S('line', { x1: padL, x2: W - padR, y1: Y(v), y2: Y(v), stroke: '#efe6d6' })); });
    ticks.forEach(function (v) { var g = S('text', { x: padL - 4, y: Y(v) + 4, 'text-anchor': 'end', class: 'cmp_ax' }); g.textContent = v + '%'; svg.appendChild(g); });
    var span = (hi - lo) / 12, ystep = span > 12 ? 5 : span > 6 ? 2 : 1; for (var y = 2006; y <= lastY; y++) { if (y % ystep && ystep > 1) continue; var i = MO.indexOf(y + '-01'); if (i < 0) continue; var tx = S('text', { x: X(i), y: H - 6, 'text-anchor': 'middle', class: 'cmp_ax' }); tx.textContent = y; svg.appendChild(tx); }
    var ends = [];
    ser.forEach(function (s, k) {
      var d = s.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join('');
      svg.appendChild(S('path', { d: d, fill: 'none', stroke: COL[k], 'stroke-width': 2.2, 'stroke-linejoin': 'round' }));
      var pk = s.indexOf(Math.max.apply(null, s)); svg.appendChild(S('circle', { cx: X(pk), cy: Y(s[pk]), r: 3.5, fill: COL[k] }));
      ends.push({ k: k, y: Y(s[n - 1]), v: s[n - 1] });
    });
    ends.sort(function (a, b) { return a.y - b.y; });
    for (var j = 1; j < ends.length; j++) if (ends[j].y - ends[j - 1].y < 14) ends[j].y = ends[j - 1].y + 14;
    box.appendChild(svg);
    ends.forEach(function (e) {
      var full = tops[e.k].label + ' ' + pct(e.v), name = short(tops[e.k].label), suffix = ' ' + pct(e.v);
      var t = S('text', { x: W - padR + 6, y: e.y + 4, fill: COL[e.k], class: 'cmp_lb', 'aria-label': full });
      t.textContent = name + suffix; svg.appendChild(t);
      var room = padR - 10, cut = name.length;
      while (t.getComputedTextLength() > room && cut > 1) { cut--; t.textContent = name.slice(0, cut).trimEnd() + '\u2026' + suffix; }
      var hint = S('title', {}); hint.textContent = full; t.appendChild(hint);
    });
    tops.forEach(function (t, k) {
      var removable = st.topics.length > 1, b = el(removable ? 'button' : 'span', 'cmp_chip', short(t.label) + (removable ? ' \u00d7' : ''));
      b.style.borderColor = COL[k];
      if (removable) { b.type = 'button'; b.setAttribute('aria-label', 'Remove ' + t.label); b.onclick = function () { go(st.topics.filter(function (x) { return x !== t.id; })); }; }
      else b.setAttribute('aria-label', 'Selected topic: ' + t.label);
      row.appendChild(b);
    });
    if (st.topics.length < 6) {
      var sel = el('select', 'cmp_add'); sel.appendChild(el('option', '', '+ topic')); sel.firstChild.value = '';
      D.topics.filter(function (t) { return st.topics.indexOf(t.id) < 0; }).sort(function (a, b) { return a.label < b.label ? -1 : 1; }).forEach(function (t) { var o = el('option', '', t.label); o.value = t.id; sel.appendChild(o); });
      sel.onchange = function () { if (sel.value) go(st.topics.concat(sel.value)); };
      row.appendChild(sel);
    }
    if (tid) { var t0 = D.byId[tid], b = el('button', 'cmp_chip cmp_det', 'Details'); b.onclick = function () { sheet(t0); }; row.insertBefore(b, row.firstChild);
       }
    if (tid) {
      var source = el('p', 'src rg_fine cmp_evidence');
      source.textContent = 'Topic ID: ' + tid + '. Exact rule shown above, matched on titles ignoring case. Topic chart coverage: ' + D.months[0] + ' to ' + D.months[D.months.length - 1] + '. CSV source: data/film_shares.json; its coverage is checked when downloading.';
      var download = el('button', 'cmp_chip', 'Download monthly counts'); download.type = 'button'; download.id = 'cmp_csv';
      download.onclick = async function () {
        download.disabled = true;
        try {
          var film = await evidence(), text = TopicBaseline.csv(film, D, tid), rows = film.monthly.slice().sort(function (a, b) { return a.month.localeCompare(b.month); });
          source.textContent = 'Topic ID: ' + tid + '. Exact rule shown above, matched on titles ignoring case. CSV source: data/film_shares.json, ' + rows[0].month + ' to ' + rows[rows.length - 1].month + '. Counts can overlap other topics.';
          var url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })), a = el('a'); a.href = url; a.download = tid + '-monthly-counts.csv'; a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        } catch (err) { source.textContent = 'Download unavailable: ' + err.message + '. No data was substituted.'; }
        finally { download.disabled = false; }
      };
      root.appendChild(download); root.appendChild(source);
    }
    if (tid) baseline(tid);
    findLinks(root, tops);
  }
  function baseline(tid) {
    var slot = document.getElementById('cmp_baseline'), hash = location.hash;
    slot.hidden = false; slot.textContent = 'Loading period counts...';
    evidence().then(function (film) {
      if (location.hash !== hash || !slot.isConnected) return;
      var initial = TopicBaseline.compare(film, D, tid), years = initial.eligibleYears;
      var params = new URLSearchParams(hash.split('?')[1] || ''), base = params.get('base'), range = null, note = baselineNotice && baselineNotice.hash === hash ? baselineNotice.text : '';
      if (base) {
        var m = /^(\d{4})-(\d{4})$/.exec(base);
        if (m && years.indexOf(+m[1]) >= 0 && years.indexOf(+m[2]) >= 0 && +m[1] <= +m[2]) range = { from: +m[1], to: +m[2] };
        else { note = 'Invalid baseline. Showing all earlier months.'; params.delete('base'); history.replaceState(null, '', location.pathname + location.search + hash.split('?')[0] + (params.toString() ? '?' + params.toString() : '')); baselineNotice = {hash: location.hash, text: note}; }
      }
      var result = TopicBaseline.compare(film, D, tid, range); slot.replaceChildren();
      slot.appendChild(el('h3', '', 'Compare with an earlier baseline'));
      var explanation = el('p', 'src rg_fine', 'Latest stays fixed. All earlier months includes every source month before it, even months in its first year. A chosen range uses only earlier calendar years. Counts use available source months; the first archive year may be partial. Chart zoom does not change this baseline.'); slot.appendChild(explanation);
      if (note) slot.appendChild(el('p', 'src rg_fine baseline_notice', note));
      var controls = el('div', 'baseline_controls');
      function choose(label, id, value) {
        var l = el('label', '', label), select = el('select', 'cmp_add'); select.id = id;
        years.forEach(function (y) { var o = el('option', '', y); o.value = y; select.appendChild(o); }); select.value = value;
        l.appendChild(select); controls.appendChild(l); return select;
      }
      var from = choose('Earlier from year', 'base_from', range ? range.from : years[0]), to = choose('Earlier through year', 'base_to', range ? range.to : years[years.length - 1]);
      function update(value) { baselineNotice = null; var q = new URLSearchParams(location.hash.split('?')[1] || ''); if (value) q.set('base', value); else q.delete('base'); location.hash = '#/t/' + tid + (q.toString() ? '?' + q.toString() : ''); }
      var apply = el('button', 'cmp_chip', 'Use these years'); apply.type = 'button'; apply.disabled = !years.length;
      var error = el('p', 'src rg_fine'); error.setAttribute('role', 'status');
      apply.onclick = function () { if (+from.value > +to.value) { error.textContent = 'From year must be no later than through year.'; return; } update(from.value + '-' + to.value); };
      var reset = el('button', 'cmp_chip', 'Use all earlier months'); reset.type = 'button'; reset.onclick = function () { update(null); };
      controls.appendChild(apply); controls.appendChild(reset); slot.appendChild(controls); slot.appendChild(error);
      function period(label, v) { var months = v.months, p = el('p', 'baseline_period'); p.appendChild(el('b', '', label + (months.length ? ', ' + months[0] + ' to ' + months[months.length - 1] : ', no source months'))); p.appendChild(el('span', '', v.n.toLocaleString('en-US') + ' matching titles / ' + v.total.toLocaleString('en-US') + ' all-story titles; pooled share ' + (v.share === null ? 'unavailable' : pct(v.share * 100)) + '.')); slot.appendChild(p); }
      period('Latest 12 months', result.latest); period(range ? 'Baseline years ' + range.from + ' to ' + range.to : 'All earlier months', result.baseline);
      slot.appendChild(el('p', 'baseline_ratio', result.ratio === null ? 'Latest-to-baseline ratio unavailable: an empty period, zero total or zero baseline share has no ratio.' : 'Latest-to-baseline share ratio: ' + result.ratio.toFixed(2) + 'x. A ratio does not establish a cause.'));
      var share = el('button', 'cmp_chip', 'Share this page'); share.type = 'button'; share.dataset.share = 'topic'; slot.appendChild(share);
    }).catch(function (err) { if (topicId() === tid) { slot.textContent = 'Period comparison unavailable: ' + err.message + '. No data was substituted.'; } });
  }
  // Search links for topics that are one plain word. Word groups have no link: the Explorer searches one word at a time.
  function findLinks(root, tops) {
    var slot = document.getElementById('cmp_find'); if (slot) { slot.replaceChildren(); slot.hidden = true; }
    var fl = tops.map(function (t) { var m = /^\\b([a-z0-9]+)\\b$/.exec(t.matcher); return m ? { label: short(t.label), w: m[1] } : null; }).filter(Boolean);
    if (!fl.length || !slot) return;
    var p = slot; p.hidden = false; p.appendChild(document.createTextNode('Search the stories for '));
    fl.forEach(function (f, i) { var a = el('a', '', f.label); a.href = '#/explore?q=' + f.w + '&whole=1'; p.appendChild(a); if (i < fl.length - 1) p.appendChild(document.createTextNode(', ')); });
    if (fl.length < tops.length) p.appendChild(document.createTextNode('. Topics that are word groups have no link.'));
  }
  function sheet(t) {
    var d = document.createElement('dialog'); d.className = 'cmp_sheet';
    var w = D.windows, f = function (x) { return pct(x.share * 100) + ' (' + x.n.toLocaleString('en-US') + ' of ' + x.total.toLocaleString('en-US') + ' stories)'; };
    var heading = el('h3', '', t.label); heading.id = 'cmp_dialog_title'; d.setAttribute('aria-labelledby', heading.id); d.appendChild(heading);
    [['Latest 12 months, ' + w.latest[0] + ' to ' + w.latest[1], f(t.latest)], ['All earlier stories, ' + w.prior[0] + ' to ' + w.prior[1], f(t.prior)], ['Peak year', t.peak.year + ' at ' + pct(t.peak.share * 100)], ['Pattern', t.pattern], ['Word list (matches story titles, case-insensitive)', t.matcher]].forEach(function (r) { d.appendChild(el('b', '', r[0])); d.appendChild(el('p', r[0].indexOf('Word list') === 0 ? 'cmp_matcher' : '', r[1])); });
    var trigger = document.activeElement; d.addEventListener('close', function () { d.remove(); if (trigger && trigger.isConnected) trigger.focus(); }, { once: true });
    var x = el('button', 'cmp_chip', 'Close'); x.onclick = function () { d.close(); }; d.appendChild(x); document.body.appendChild(d); d.showModal();
  }
  window.HowInit = function () {
    fetch('data/manifest.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (m) { var e = document.getElementById('how_built'); if (!e || !m.generated_at || !m.total_rows) return; e.textContent = 'The Explorer reads ' + m.total_rows.toLocaleString('en-US') + ' posts, built ' + m.generated_at.slice(0, 10) + ' (UTC). Source: data/manifest.json.'; e.hidden = false; }).catch(function () { });
    loading = loading || fetch('data/topic_series.json').then(function (r) { return r.json(); }).then(function (d) { d.byId = {}; d.topics.forEach(function (t) { d.byId[t.id] = t; }); D = d; });
    loading.then(function () { var e = document.getElementById('how_start'); if (e && D.months.length) e.textContent = D.months[0].slice(0, 4); });
  };
  window.TopicsInit = function () {
    loading = loading || fetch('data/topic_series.json').then(function (r) { return r.json(); }).then(function (d) { d.byId = {}; d.topics.forEach(function (t) { d.byId[t.id] = t; }); D = d; });
    loading.then(function () {
      var box = document.getElementById('topics_list'); box.replaceChildren(); var tn = document.getElementById('tp_note'); if (tn && D.windows) tn.textContent = 'The x figure compares a topic\u2019s share of story titles in the latest 12 months (' + D.windows.latest[0] + ' to ' + D.windows.latest[1] + ') with its share in all earlier months (' + D.windows.prior[0] + ' to ' + D.windows.prior[1] + ').';
      D.topics.slice().sort(function (a, b) { return a.label < b.label ? -1 : 1; }).forEach(function (t) {
        var a = el('a', 'tp_row'); a.href = '#/t/' + t.id; a.appendChild(el('b', '', t.label)); a.appendChild(el('span', 'tp_pat', t.pattern)); if (t.ratio) a.appendChild(el('span', 'tp_ratio', (t.ratio >= 10 ? t.ratio.toFixed(0) : t.ratio.toFixed(1)) + 'x the all-earlier share'));
        var s = t.series.slice(-120), mx = Math.max.apply(null, s) || 1, svg = S('svg', { viewBox: '0 0 80 20', width: 80, height: 20, 'aria-hidden': 'true', focusable: 'false' });
        svg.appendChild(S('path', { d: s.map(function (v, i) { return (i ? 'L' : 'M') + (i * 80 / 119).toFixed(1) + ' ' + (19 - 18 * v / mx).toFixed(1); }).join(''), fill: 'none', stroke: '#ff6600', 'stroke-width': 1.5 }));
        a.appendChild(svg); box.appendChild(a); });
      var rowOf = {}; [].forEach.call(box.children, function (r, i) { rowOf[r.getAttribute('href').slice(4)] = r; });
      var ord = function (v) { var L = D.topics.slice(); if (v === 'rise' || v === 'fall') L.sort(function (a, b) { var x = a.ratio || 0, y = b.ratio || 0; if (!x || !y) return !x && !y ? (a.label < b.label ? -1 : 1) : (!x ? 1 : -1); return v === 'rise' ? y - x : x - y; }); else L.sort(function (a, b) { return a.label < b.label ? -1 : 1; }); return L; };
      var so = document.getElementById('tp_sort'), q = document.getElementById('tp_q'), none = document.getElementById('tp_none');
      var params = new URLSearchParams(location.hash.split('?')[1] || '');
      so.value = /^(rise|fall)$/.test(params.get('sort')) ? params.get('sort') : 'az'; q.value = (params.get('q') || '').slice(0, 80);
      var save = function () { var u = new URLSearchParams(); if (so.value !== 'az') u.set('sort', so.value); if (q.value) u.set('q', q.value); var t = u.toString(); history.replaceState(null, '', location.pathname + location.search + '#/topics' + (t ? '?' + t : '')); };
      var sortTo = function () { ord(so.value).forEach(function (t) { box.appendChild(rowOf[t.id]); }); };
      var filt = function () { var v = q.value.trim().toLowerCase(), n = 0; [].forEach.call(box.children, function (r) { var ok = !v || r.querySelector('b').textContent.toLowerCase().indexOf(v) >= 0; r.hidden = !ok; if (ok) n++; }); none.hidden = n > 0; document.getElementById('tp_clear').hidden = !q.value; document.getElementById('tp_count').textContent = v ? n + ' of ' + D.topics.length + ' topics match.' : D.topics.length + ' topics.'; };
      so.onchange = function () { sortTo(); save(); }; q.oninput = function () { filt(); save(); }; document.getElementById('tp_clear').onclick = function () { q.value = ''; filt(); save(); q.focus(); }; sortTo(); filt();
    });
  };
  window.CompareInit = function () {
    loading = loading || fetch('data/topic_series.json').then(function (r) { return r.json(); }).then(function (d) { d.byId = {}; d.topics.forEach(function (t) { d.byId[t.id] = t; }); D = d; });
    loading.then(async function () { if (/[?&]years=/.test(location.hash) && !window.YearZoom) await new Promise(function (ok, no) { var sc = document.createElement('script'); sc.src = 'yearzoom.js'; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); }); draw(); var e = document.getElementById('cmp_src'); if (e && D.months.length) e.textContent = 'Source: titles of every story, ' + D.months[0] + ' to ' + D.months[D.months.length - 1] + '. Each line is the monthly share of stories whose title matches the topic words. Archive scores are not used.'; }).catch(function () { document.getElementById('cmp').textContent = 'The comparison data could not be loaded. Try again.'; loading = null; });
  };
  addEventListener('resize', function () { if (D && document.getElementById('v_compare') && !document.getElementById('v_compare').hidden) draw(); });
})();
