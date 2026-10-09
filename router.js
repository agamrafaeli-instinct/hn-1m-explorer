'use strict';
// Hash router: one view at a time, so every page is short and phone-first.
(function () {
  const $ = id => document.getElementById(id);
  const AUD = {
    engineers: { name: 'Engineers', fallback: 'h009', tag: 'engineers', clean: ['h012', 'h014', 'h026'], note: 'Read this first: these cards were explored before their thresholds were fixed, so they are not blind pre-registrations. H012, H014 and H026 are the cleanest tests. H016 and H026 are refuted, and those stay on the page.' },
    vcs: { name: 'Deep-tech VCs', fallback: 'h010', tag: 'deep-tech investors', note: 'How to read these: the history cards (H115-H119) use archive snapshot points and shares, matched on title and text. H118 (solar matches) is refuted, but that is not proof that solar adoption fell.' },
    geeks: { name: 'Curious geeks', fallback: 'h011', tag: 'curious readers', note: 'Read this first: these cards are exploratory. The odd-and-fun word lists and thresholds were set while looking at earlier summaries, so they are not blind tests. Scores are a snapshot of a short window. Cards H135-H149 use a fixed snapshot window and do not refresh daily. Refuted cards stay on the page.' }
  };
  const views = ['home', 'aud', 'week', 'story', 'hyp', 'explore', 'submit', 'how'];
  const tabOf = { home: 'home', aud: '', week: '', story: '', hyp: '', explore: 'explore', submit: 'submit', how: 'how' };
  function deeper(list, key) {
    const box = $('aud_deeper'); box.replaceChildren();
    if (!list.length) return;
    const h = document.createElement('h3'); h.textContent = 'Go deeper'; box.appendChild(h);
    if (AUD[key].note) { const n = document.createElement('p'); n.className = 'caveat-note'; n.textContent = AUD[key].note; box.appendChild(n); }
    list.forEach(x => { const l = document.createElement('a'); l.href = '#/c/' + x.name.split('-')[0] + '/' + key; l.className = 'deep';
      const t = document.createElement('b'); t.textContent = x.title; const v = document.createElement('span'); v.textContent = x.verdict === 'inconclusive' ? 'Inconclusive' : (x.verdict[0].toUpperCase() + x.verdict.slice(1) + ' \u00b7 ' + x.confidence);
      const id = x.name.split('-')[0]; if ((AUD[key].clean || []).includes(id)) { const c = document.createElement('i'); c.textContent = 'Cleanest test'; l.appendChild(c); } v.className = 'vd ' + x.verdict; l.append(t, v); box.appendChild(l); });
  }
  function skel() { const d = document.createElement('div'); d.className = 'skel'; d.setAttribute('aria-label', 'Loading'); $('aud_card').replaceChildren(d); }
  async function single(id, key) {
    const a = AUD[key] || (key === 'all' ? { name: 'All audiences' } : AUD.engineers); $('aud_kicker').textContent = a.name; $('aud_note').textContent = ''; $('aud_deeper').replaceChildren(); $('aud_others').replaceChildren();
    $('aud_back').href = key === 'all' ? '#/hypotheses' : '#/a/' + (AUD[key] ? key : 'engineers');
    skel();
    try { const x = await HypCards.one(id); $('aud_card').replaceChildren(compact(HypCards.render(x.card, x.r))); }
    catch (e) { $('aud_card').textContent = 'Could not load this hypothesis: ' + e.message; }
  }
  async function audience(key) {
    $('aud_back').href = '#/';
    const a = AUD[key]; $('aud_kicker').textContent = a.name;
    skel(); $('aud_note').textContent = '';
    $('aud_others').replaceChildren(...Object.keys(AUD).filter(k => k !== key).map(k => { const l = document.createElement('a'); l.href = '#/a/' + k; l.textContent = AUD[k].name + ' \u2192'; return l; }));
    try {
      const ok = (await HypCards.tally()).filter(x => !x.error);
      const mine = ok.filter(x => x.audience === a.tag), own = mine.find(x => x.name.startsWith(a.fallback)) || mine[0], pick = own || ok.find(x => x.name.startsWith(a.fallback));
      if (!pick) throw new Error('no card yet');
      const x = await HypCards.one(pick.name.split('-')[0]);
      $('aud_card').replaceChildren(compact(HypCards.render(x.card, x.r)));
      deeper(mine.filter(y => y !== pick), key);
      if (!own) $('aud_note').textContent = 'A card written for this audience is coming. This is the closest tested hypothesis for now.';
    } catch (e) { $('aud_card').textContent = 'Could not load this hypothesis: ' + e.message; }
  }
  const compact = c => HypCards.compact(c);
  async function counts() {
    try {
      const list = (await HypCards.tally()).filter(x => !x.error);
      document.querySelectorAll('.pick em').forEach(e => {
        const t = e.dataset.aud, rows = t === '*' ? list.filter(x => !x.audience) : list.filter(x => x.audience === t);
        const sup = rows.filter(x => x.verdict === 'supported').length, ref = rows.filter(x => x.verdict === 'refuted').length;
        e.textContent = rows.length + ' tested \u00b7 ' + sup + ' supported \u00b7 ' + ref + ' refuted';
      });
    } catch (e) { }
  }
  counts();
  let weekLoad;
  function loadWeek(a, wk) {
    weekLoad = weekLoad || new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'weekly.js'; s.onload = ok; s.onerror = () => no(new Error('weekly.js')); document.head.appendChild(s); });
    weekLoad.then(() => window.WeekInit(a, wk)).catch(e => { $('w_body').textContent = 'Could not load this screen: ' + e.message; });
  }
  async function homeWeek() {
    try {
      const i = await (await fetch('data/weekly/index.json')).json(), w = i.weeks[i.weeks.length - 1], s = new Date(w.start_utc + 'T00:00:00Z'), e = new Date(s); e.setUTCDate(e.getUTCDate() + 6);
      const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      $('homeweek_s').textContent = M[s.getUTCMonth()] + ' ' + s.getUTCDate() + ' to ' + M[e.getUTCMonth()] + ' ' + e.getUTCDate() + ' \u00b7 ' + w.week;
      $('homeweek').href = '#/w/engineers/' + w.week;
    } catch (x) { }
  }
  homeWeek();
  let cur;
  function route() {
    const p = (location.hash || '#/').replace(/^#\/?/, '').split('/');
    let v = 'home';
    if (p[0] === 'a' && AUD[p[1]]) v = 'aud'; else if (p[0] === 'c' && /^h\d+$/.test(p[1] || '')) v = 'aud'; else if (p[0] === 'w' && AUD[p[1]]) v = 'week'; else if (['story', 'explore', 'submit', 'how'].includes(p[0])) v = p[0]; else if (p[0] === 'hypotheses') v = 'hyp';
    views.forEach(n => $('v_' + n).hidden = n !== v);
    document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.t === tabOf[v]));
    if (v === 'hyp') HypCards.initList();
    if (v === 'story' || v === 'explore') window.StoryInit && window.StoryInit();
    if (v === 'explore') { window.ExploreInit && window.ExploreInit(); window.ExploreVendor && window.ExploreVendor(); }
    if (v === 'week') loadWeek(p[1], p[2]);
    if (v === 'aud') { if (p[0] === 'c') single(p[1], p[2]); else audience(p[1]); }
    if (cur !== v || v === 'aud') scrollTo({ top: 0, behavior: 'instant' });
    cur = v;
    document.body.dataset.view = v;
    setTimeout(() => { dispatchEvent(new Event('resize')); dispatchEvent(new Event('scroll')); }, 60);
  }
  addEventListener('hashchange', route); route();
})();
