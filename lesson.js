(function () {
  'use strict';
  var done = false;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var pct = function (v) { return (v < 0.1 ? v.toFixed(3) : v.toFixed(2)) + '%'; };
  var mo = function (m) { var n = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], p = m.split('-'); return n[+p[1] - 1] + ' ' + p[0]; };
  var win = function (w) { return mo(w[0]) + ' to ' + mo(w[1]); };
  var fx = function (v) { return (v >= 10 ? v.toFixed(0) : v >= 1 ? v.toFixed(1) : v.toFixed(2)) + 'x'; };
  var KIND = { 'reversal': 'Reversal', 'peak decay': 'Peak decay', 'emergence': 'Emergence', 'episode': 'Back at its peak' };
  var DRILL = { 'ChatGPT and GPT': ['#/a/engineers', 'See the cards'], 'Data centers': ['#/c/h319/vcs', 'See the card'] };
  var DESC = { 'ChatGPT and GPT': 'Titles that name ChatGPT or a GPT model.', 'Ukraine': 'Titles about the country, its cities and the war context.', 'Basic income': 'Basic income, guaranteed income and UBI, without the file system.',
    'Y Combinator': 'Titles that name Y Combinator, with and without batch labels.', 'Data centers': 'Titles about data centers and hyperscale, and what they are paired with.', 'Shipping chokepoints': 'Hormuz, Suez, Red Sea and Panama, and ship incidents.', 'Recession': 'Recession, soft landing and yield curve talk.' };
  window.LessonInit = function () {
    if (done) return; done = true;
    fetch('data/reversal.json').then(function (r) { return r.json(); }).then(function (d) {
      var g = d.rows[0];
      document.getElementById('ls_lede').textContent = 'GPT is down ' + Math.round((1 - g.vs_peak) * 100) + '% from its peak year on Hacker News. It is also ' + fx(g.vs_history) + ' its share before that peak. Both are true. Which one you call the trend depends on the baseline you pick.';
      var box = document.getElementById('ls_gpt');
      [['Latest 12 months', g.latest], ['Peak year', g.peak], ['All earlier stories', g.history]].forEach(function (x) {
        var c = el('div', 'lsrow'); c.appendChild(el('b', '', x[0] + ': ' + pct(x[1].pct)));
        c.appendChild(el('span', '', x[1].n.toLocaleString('en-US') + ' of ' + x[1].total.toLocaleString('en-US') + ' stories, ' + win(x[1].window))); box.appendChild(c);
      });
      box.appendChild(el('p', 'lsnote', 'Latest is ' + fx(g.vs_peak) + ' the peak and ' + fx(g.vs_history) + ' the earlier history.'));
      var rows = document.getElementById('ls_rows');
      d.rows.slice(1).forEach(function (r) {
        var c = el('div', 'lscard'); var h = el('div', 'lshead'); h.appendChild(el('b', '', r.label)); h.appendChild(el('span', 'lstag ' + r.kind.replace(' ', ''), KIND[r.kind] || r.kind)); c.appendChild(h);
        c.appendChild(el('p', 'lsnums', fx(r.vs_history) + ' history · ' + fx(r.vs_peak) + ' peak (' + win(r.peak.window) + ')'));
        c.appendChild(el('p', 'lsnote', r.note)); rows.appendChild(c);
      });
      var f = d.framing;
      document.getElementById('ls_frame').textContent = 'Data centers also changed shape. Titles that pair them with power, water, zoning or opposition words were ' + Math.round(f.latest.share * 1000) / 10 + '% of data center titles in the latest 12 months (' + f.latest.n + ' of ' + f.latest.of.toLocaleString('en-US') + ') against ' + Math.round(f.history.share * 1000) / 10 + '% before (' + f.history.n + ' of ' + f.history.of.toLocaleString('en-US') + ').';
      document.getElementById('ls_cav').textContent = 'These are word-list screens on story titles, not full topic measures. They show wording, not adoption, importance or sentiment. Word lists and counts: docs/research in the repository.';
    }).catch(function () { done = false; document.getElementById('ls_lede').textContent = 'The numbers could not be loaded. Try again.'; });
  };
})();
