(function () {
  'use strict';
  // Row-level search over every year of stories (#198). The engine (DuckDB-WASM) loads only when a search is asked for.
  // It reads the year files in data/archive with range requests, newest years first, at most MAXY years registered at once.
  var MAXY = 3, eng, files, cur = null;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function mb(b) { return b < 1048576 ? Math.max(1, Math.round(b / 1024)) + ' KB' : Math.round(b / 1048576) + ' MB'; }
  function esc(s) { return String(s).replace(/'/g, "''"); }
  function engine(say) {
    if (eng) return eng;
    eng = (async function () {
      say('Loading the search engine (about 8 MB, once)...');
      var m = await import('./vendor/duckdb/duck.mjs');
      var w = new Worker('vendor/duckdb/worker.js'), db = new m.AsyncDuckDB(new m.VoidLogger(), w);
      await db.instantiate(new URL('vendor/duckdb/duckdb-eh.wasm', location.href).href);
      await db.open({ filesystem: { allowFullHTTPReads: false, reliableHeadRequests: true, forceFullHTTPReads: false } });
      return { db: db, conn: await db.connect(), P: m.DuckDBDataProtocol.HTTP, reg: [] };
    })();
    eng.catch(function () { eng = null; });
    return eng;
  }
  function manifest() {
    return files || (files = fetch('data/archive/manifest.json').then(function (r) { return r.json(); }).then(function (m) {
      return m.files.filter(function (f) { return f.kind === 'stories'; }).sort(function (a, b) { return b.year - a.year; });
    }));
  }
  function where(q) {
    var w = ['type = 1', 'title is not null'];
    q.words.forEach(function (x) { w.push("title ilike '%" + esc(x).replace(/[%_]/g, '\\$&') + "%' escape '\\'"); });
    if (q.domain) w.push("regexp_extract(url, '^https?://(?:www\\.)?([^/:]+)', 1) ilike '%" + esc(q.domain).replace(/[%_]/g, '\\$&') + "%' escape '\\'");
    if (q.min > 0) w.push('score >= ' + (q.min | 0));
    if (q.from) w.push("time >= timestamptz '" + q.from + " 00:00:00+00'");
    if (q.to) w.push("time < timestamptz '" + q.to + " 00:00:00+00' + interval 1 day");
    return w.join(' and ');
  }
  async function batch(q, set, out, say) {
    var e = await engine(say), names = [];
    for (var i = 0; i < e.reg.length; i++) await e.db.dropFile(e.reg[i]);
    e.reg = [];
    for (var j = 0; j < set.length; j++) {
      var n = 'y' + set[j].year + '.parquet'; await e.db.registerFileURL(n, new URL('data/archive/' + set[j].name, location.href).href, e.P, true);
      e.reg.push(n); names.push("'" + n + "'");
    }
    var yrs = set[set.length - 1].year + (set.length > 1 ? ' to ' + set[0].year : ''), sz = set.reduce(function (a, f) { return a + f.bytes; }, 0);
    say('Searching ' + yrs + ' (files total ' + mb(sz) + ', only the needed parts are read)...');
    var sql = "select id, title, url, score, descendants, strftime(time, '%Y-%m-%d') d from read_parquet([" + names.join(',') + "]) where " + where(q) + ' order by score desc nulls last limit 25';
    var cnt = "select count(*) n from read_parquet([" + names.join(',') + "]) where " + where(q);
    var r = (await e.conn.query(sql)).toArray(), n = Number((await e.conn.query(cnt)).toArray()[0].n);
    var h = el('h4', 'rs_h', yrs + ': ' + n.toLocaleString() + ' ' + (n === 1 ? 'story' : 'stories') + (n > 25 ? ', top 25 by score' : ''));
    out.appendChild(h);
    if (!r.length) out.appendChild(el('p', 'wn', 'No stories match in these years.'));
    else {
      var ol = el('ol', 'rs_l');
      r.forEach(function (x) {
        var li = el('li'), a = el('a', null, x.title); a.href = 'https://news.ycombinator.com/item?id=' + x.id; a.target = '_blank'; a.rel = 'noopener';
        li.appendChild(a); li.appendChild(el('span', 'rs_m', ' ' + x.d + ', ' + (x.score == null ? 0 : x.score) + ' points, ' + (x.descendants == null ? 0 : x.descendants) + ' comments'));
        ol.appendChild(li);
      });
      out.appendChild(ol);
    }
  }
  window.RowSearch = function (root) {
    var f = el('form', 'rs_f'), out = el('div', 'rs_out'), st = el('p', 'wsh'), more = el('button', 'cta alt2', 'Search older years');
    function inp(ph, lab, type) { var i = el('input'); i.type = type || 'search'; i.placeholder = ph; i.setAttribute('aria-label', lab); i.autocomplete = 'off'; return i; }
    var qw = inp('Title words', 'Title words'), dm = inp('Domain', 'Domain'), sc = inp('Min score', 'Minimum score', 'number'), fr = inp('', 'From date', 'date'), to = inp('', 'To date', 'date');
    sc.min = 0;
    var r1 = el('div', 'hist_f'), r2 = el('div', 'rs_dates'), go = el('button', 'cta', 'Search all years');
    r1.appendChild(qw); r1.appendChild(dm); r2.appendChild(el('label', null, 'From')); r2.lastChild.appendChild(fr); r2.appendChild(el('label', null, 'To')); r2.lastChild.appendChild(to); r2.appendChild(sc); r2.appendChild(go);
    f.appendChild(r1); f.appendChild(r2); more.hidden = true; more.type = 'button';
    root.appendChild(f); root.appendChild(st); root.appendChild(out); root.appendChild(more);
    root.appendChild(el('p', 'rs_n', 'Stories only: the archive keeps no author names or comment text. Scores are as fetched, so recent stories may still be gaining points. Points are low for 2023 and 2026. Author search is below, on the newest items.'));
    var say = function (t) { st.textContent = t; };
    function run(first) {
      if (first) { out.replaceChildren(); cur = null; }
      go.disabled = more.disabled = true;
      manifest().then(function (all) {
        if (first) {
          var q = { words: qw.value.trim().toLowerCase().split(/\s+/).filter(Boolean), domain: dm.value.trim(), min: +sc.value || 0, from: fr.value, to: to.value };
          var y0 = q.from ? +q.from.slice(0, 4) : 0, y1 = q.to ? +q.to.slice(0, 4) : 9999;
          cur = { q: q, left: all.filter(function (x) { return x.year >= y0 && x.year <= y1; }) };
        }
        var set = cur.left.splice(0, MAXY);
        if (!set.length) { say('No years in that date range.'); return; }
        return batch(cur.q, set, out, say).then(function () {
          say(cur.left.length ? cur.left.length + ' older ' + (cur.left.length === 1 ? 'year' : 'years') + ' not searched yet.' : 'Searched every year in range.');
          more.hidden = !cur.left.length;
        });
      }).catch(function (e) { say('The search could not run: ' + (e && e.message || e)); }).then(function () { go.disabled = more.disabled = false; });
    }
    f.onsubmit = function (e) { e.preventDefault(); run(true); };
    more.onclick = function () { run(false); };
  };
})();
