'use strict';
// "This week" screens: #/w/<engineers|vcs|geeks>[/<week>]. Loads data/weekly/index.json and one data/compare/<week>.json only.
(function () {
  const A = {
    engineers: { name: 'Engineers', title: "Builder's radar", intro: 'What moved this week among the things people build with.' },
    vcs: { name: 'Deep-tech VCs', title: 'Money and names', intro: 'Which deep tech themes, names and deal words moved this week.' },
    geeks: { name: 'Curious geeks', title: 'Beyond AI', intro: 'What people talked about this week that is not AI.' }
  };
  const SPEC = 'https://github.com/agamrafaeli-instinct/hn-1m-explorer/blob/main/docs/WEEKLY_SPEC.md';
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const root = () => document.getElementById('w_body');
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  const n = x => Number(x).toLocaleString('en-US');
  const pl = (k, w) => n(k) + ' ' + w + (k === 1 ? '' : 's');
  const pct = x => (x * 100).toFixed(1) + '%';
  function range(start, endEx) {
    const s = new Date(start + 'T00:00:00Z'), e = new Date(endEx + 'T00:00:00Z'); e.setUTCDate(e.getUTCDate() - 1);
    const f = d => MON[d.getUTCMonth()] + ' ' + d.getUTCDate();
    return f(s) + ' to ' + f(e);
  }
  const jc = window.__jc || (window.__jc = {});
  function getJSON(u) { return jc[u] || (jc[u] = fetch(u).then(r => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); })); }
  const hnLink = it => { const a = el('a', 'wl', it.title || '(no title)'); a.href = 'https://news.ycombinator.com/item?id=' + encodeURIComponent(it.id); a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; };
  function storyList(items) {
    const ul = el('ul', 'wlist');
    items.forEach(it => { const li = el('li'); li.append(hnLink(it)); const m = [it.domain, pl(it.points, 'point'), pl(it.comments, 'comment')].filter(Boolean).join(' \u00b7 '); li.append(el('span', 'wm', m)); ul.appendChild(li); });
    return ul;
  }
  function section(title, cls) { const s = el('section', 'wsec ' + (cls || '')); s.appendChild(el('h3', null, title)); return s; }
  function flagRow(r, kind) {
    const li = el('li', 'wf ' + kind);
    li.appendChild(el('b', null, r.label));
    const txt = kind === 'new'
      ? (r.last == null && r.group === 'Sites' ? n(r.this) + ' stories this week, 2 or fewer last week' : n(r.this) + ' this week, none in the 4 weeks before')
      : n(r.this) + ' this week, about ' + n(Math.round(r.expected)) + ' expected from last week';
    li.appendChild(el('span', null, txt));
    li.appendChild(el('i', null, r.group));
    return li;
  }
  function changes(c, a) {
    const d = c.audiences[a], s = section('What changed');
    if (!c.prev_week) { s.appendChild(el('p', 'wn', 'This is the first saved week, so there is no week before it to compare with.')); return s; }
    const sets = [['Rose', d.rose, 'rose'], ['Fell', d.fell, 'fell'], ['New', a === 'engineers' || a === 'geeks' ? c.new_domains.concat(d.new) : d.new.concat(c.new_domains), 'new']];
    let any = false;
    sets.forEach(([t, rows, k]) => { if (!rows.length) return; any = true; const h = el('h4', 'wh ' + k, t); const ul = el('ul', 'wfl'); rows.slice(0, k === 'new' ? 5 : 3).forEach(r => ul.appendChild(flagRow(r, k))); s.append(h, ul); });
    d.shares.filter(x => x.state === 'rose' || x.state === 'fell').forEach(x => { any = true; const p = el('p', 'wsh ' + x.state, (x.state === 'rose' ? 'Up: ' : 'Down: ') + x.label + ' is ' + pct(x.this) + ', last week ' + pct(x.last) + ', 4 week average ' + pct(x.avg4) + '.'); s.appendChild(p); });
    if (!any) s.appendChild(el('p', 'wn', 'No big changes against ' + c.prev_week + '.'));
    s.appendChild(el('p', 'wn', 'Compared with ' + c.prev_week + '. A count is flagged when it is at least 8 away from what last week predicts and at least 3 standard errors. ' + (d.small ? n(d.small) + ' items were too small to tell.' : '')));
    return s;
  }
  function shares(c, a) {
    const s = section('Usual level'), list = c.audiences[a].shares.concat(a === 'geeks' ? [] : []);
    const ul = el('ul', 'wsl');
    list.forEach(x => {
      const li = el('li'); li.appendChild(el('b', null, x.label));
      const v = el('span', 'wv', pct(x.this)); li.appendChild(v);
      li.appendChild(el('em', null, x.avg4 == null ? 'Needs 4 earlier saved weeks to show an average' : '4 week average ' + pct(x.avg4)));
      ul.appendChild(li);
    });
    s.appendChild(ul);
    return s;
  }
  function bar(rows, unit, est) {
    const max = Math.max(1, ...rows.map(r => r.value)), box = el('div', 'wbars' + (est ? ' est' : ''));
    rows.forEach(r => { const row = el('div', 'wb'); row.appendChild(el('span', 'wl2', r.label)); const t = el('span', 'wt'); const i = el('i'); i.style.width = r.present_only ? (r.value ? '8%' : '0%') : Math.max(2, r.value / max * 100) + '%'; t.appendChild(i); row.append(t, el('span', 'wc', r.present_only ? (r.value ? 'seen' : 'none') : n(r.value))); box.appendChild(row); });
    return box;
  }
  function extra(c, a) {
    const d = c.audiences[a], frag = document.createDocumentFragment();
    const f = section('This week in numbers'); const ul = el('ul', 'wfacts');
    d.facts.forEach(x => { const li = el('li'); li.append(el('b', null, n(x.value)), el('span', null, x.label)); ul.appendChild(li); }); f.appendChild(ul); frag.appendChild(f);
    d.bars.forEach(b0 => { let b = b0; if (!b.rows.length) return; const s = section(b.title);
      if (b.rows.every(r => !r.value)) { if (b.estimated) s.appendChild(el('span', 'west', 'Estimate')); s.appendChild(el('p', 'wn', /hiring/i.test(b.title) ? 'No monthly hiring thread this week.' : 'None this week.')); frag.appendChild(s); return; }
      if (b.rows.some(r => r.present_only)) b = Object.assign({}, b, { note: (b.note ? b.note + ' ' : '') + 'Under 8 stories a week is too small to count, so these show only seen or none.' }); if (b.estimated) s.appendChild(el('span', 'west', 'Estimate')); s.appendChild(bar(b.rows, b.unit, b.estimated)); if (b.note) s.appendChild(el('p', 'wn', b.note)); frag.appendChild(s); });
    d.lists.forEach(l => { if (!l.items.length) return; const s = section(l.title); s.appendChild(storyList(l.items)); if (l.note) s.appendChild(el('p', 'wn', l.note)); frag.appendChild(s); });
    return frag;
  }
  function stepper(idx, i, a) {
    const w = idx[i], bar = el('div', 'wstep');
    const mk = (j, lab, arrow) => { const x = j >= 0 && j < idx.length ? el('a', 'wbtn', arrow) : el('span', 'wbtn off', arrow); if (x.tagName !== 'A') { x.setAttribute('role', 'link'); x.setAttribute('aria-disabled', 'true'); } if (x.tagName === 'A') x.href = '#/w/' + a + '/' + idx[j].week; x.setAttribute('aria-label', lab); return x; };
    const mid = el('div', 'wmid'); mid.append(el('b', null, range(w.start_utc, w.end_exclusive_utc || w.start_utc)), el('span', null, w.week + (w.kind === 'backfill' ? ' \u00b7 rebuilt from the archive' : ' \u00b7 saved live')));
    bar.append(mk(i - 1, 'Previous week', '\u2039'), mid, mk(i + 1, 'Next week', '\u203a'));
    return bar;
  }
  function pills(a, wk) {
    const nav = el('nav', 'wpills');
    Object.keys(A).forEach(k => { const x = el('a', k === a ? 'on' : '', A[k].name); x.href = '#/w/' + k + (wk ? '/' + wk : ''); nav.appendChild(x); });
    return nav;
  }
  function skeleton() { const b = root(); b.replaceChildren(el('div', 'skel wsk')); }
  let token = 0;
  async function show(a, wk) {
    if (!A[a]) a = 'engineers';
    const my = ++token; skeleton();
    document.getElementById('w_kicker').textContent = 'This week \u00b7 ' + A[a].name;
    try {
      const idx = (await getJSON('data/weekly/index.json')).weeks.slice().sort((x, y) => x.start_utc < y.start_utc ? -1 : 1);
      let i = idx.findIndex(x => x.week === wk); if (i < 0) i = idx.length - 1;
      const c = await getJSON('data/compare/' + idx[i].week + '.json');
      if (my !== token) return;
      idx[i].end_exclusive_utc = c.end_exclusive_utc;
      const b = root(), frag = document.createDocumentFragment();
      frag.append(pills(a, idx[i].week), el('h1', 'wtitle', A[a].title), el('p', 'wintro', A[a].intro), stepper(idx, i, a));
      if (c.kind === 'backfill') frag.appendChild(el('p', 'wbf', 'This week was rebuilt from the archive after it ended, with the same method and fields as a live save. The newest stories may have had more time to collect points.'));
      frag.append(changes(c, a), shares(c, a), extra(c, a));
      const top = section('Top stories of the week'); top.appendChild(storyList(c.top_stories)); frag.appendChild(top);
      const foot = el('p', 'wn wfoot', 'Hacker News talking, not a measure of what is true. Counts use stories only. Dead and deleted stories keep no title, so title-based shares divide by live stories. The dead or deleted share divides by all stories. '); const l = el('a', null, 'How it is computed'); l.href = SPEC; l.target = '_blank'; l.rel = 'noopener noreferrer'; foot.appendChild(l);
      if (c.list_version) { const lv = 'Word lists: version ' + c.list_version + (idx[i].saved_at ? ', saved ' + String(idx[i].saved_at).slice(0, 10) : '') + '.'; foot.appendChild(el('span', 'wlv', ' ' + lv)); }
      frag.appendChild(foot);
      b.replaceChildren(frag);
      const rg = range(idx[i].start_utc, idx[i].end_exclusive_utc || idx[i].start_utc);
      window.SetPageMeta && window.SetPageMeta(A[a].name + ': week ' + idx[i].week + ' (' + rg + ')', A[a].name + ' view of Hacker News for ' + rg + '. ' + A[a].intro);
      document.getElementById('w_back').href = '#/';
      scrollTo({ top: 0, behavior: 'instant' });
    } catch (e) { if (my === token) root().textContent = 'Could not load this week: ' + e.message; }
  }
  window.WeekInit = (a, wk) => show(a, wk);
})();
