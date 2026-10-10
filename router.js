'use strict';
// Hash router: one view at a time, so every page is short and phone-first.
(function () {
  const $ = id => document.getElementById(id);
  const AUD = {
    engineers: { name: 'Engineers', tag: 'engineers', clean: [], note: 'Read this first: the all-time cards (h300 onward) copy their thresholds from the older cards, so they are exploratory, not blind pre-registrations.' },
    vcs: { name: 'Deep-tech VCs', tag: 'deep-tech investors', note: 'How to read these: the theme cards (H319 onward) compare the latest 12 months with every earlier story since 2006, matched on title only. A falling share is not proof that adoption fell. Four older cards (H112, H113, H114, H119) stay frozen because they need comments or source domains, which the archive does not hold.' },
    geeks: { name: 'Curious geeks', tag: 'curious readers', note: 'Read this first: these cards are exploratory. The odd-and-fun word lists and thresholds were set while looking at earlier summaries, so they are not blind tests. Scores are a snapshot of a short window. Cards H135-H149 use a fixed snapshot window and do not refresh daily. Refuted cards stay on the page.' }
  };
  const views = ['home', 'aud', 'week', 'story', 'hyp', 'explore', 'submit', 'how', 'lesson'];
  const tabOf = { lesson: 'lesson', home: 'home', aud: '', week: '', story: '', hyp: '', explore: 'explore', submit: 'submit', how: 'how' };
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
      const mine = ok.filter(x => x.audience === a.tag), pick = mine[0];
      if (!pick) { $('aud_card').textContent = 'The cards for this group are being rebuilt as all-time cards.'; return; }
      const x = await HypCards.one(pick.name.split('-')[0]);
      $('aud_card').replaceChildren(compact(HypCards.render(x.card, x.r)));
      deeper(mine.filter(y => y !== pick), key);
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
      const jc = window.__jc || (window.__jc = {}), i = await (jc['data/weekly/index.json'] || (jc['data/weekly/index.json'] = fetch('data/weekly/index.json').then(r => r.json()))), w = i.weeks[i.weeks.length - 1], s = new Date(w.start_utc + 'T00:00:00Z'), e = new Date(s); e.setUTCDate(e.getUTCDate() + 6);
      const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      $('homeweek_s').textContent = M[s.getUTCMonth()] + ' ' + s.getUTCDate() + ' to ' + M[e.getUTCMonth()] + ' ' + e.getUTCDate() + ' \u00b7 ' + w.week;
      $('homeweek').href = '#/w/engineers/' + w.week;
    } catch (x) { }
  }
  homeWeek();
  const BASE_TITLE = document.title, META = document.querySelector('meta[name="description"]'), BASE_DESC = META ? META.content : '';
  window.SetPageMeta = (t, d) => { document.title = t + ' | ' + BASE_TITLE; if (META) META.content = d; };
  let cur;
  function route() {
    const p = (location.hash || '#/').replace(/^#\/?/, '').split('/');
    let v = 'home';
    if (p[0] === 'a' && AUD[p[1]]) v = 'aud'; else if (p[0] === 'c' && /^h\d+$/.test(p[1] || '')) v = 'aud'; else if (p[0] === 'w' && AUD[p[1]]) v = 'week'; else if (['story', 'explore', 'submit', 'how', 'lesson'].includes(p[0])) v = p[0]; else if (p[0] === 'hypotheses') v = 'hyp';
    if (v !== 'week') { document.title = BASE_TITLE; if (META) META.content = BASE_DESC; }
    views.forEach(n => $('v_' + n).hidden = n !== v);
    document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.t === tabOf[v]));
    if (v === 'hyp') HypCards.initList();
    if (v === 'lesson') window.LessonInit && window.LessonInit();
    if (v === 'home') window.HomeInit && window.HomeInit();
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
