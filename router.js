'use strict';
// Hash router: one view at a time, so every page is short and phone-first.
(function () {
  const $ = id => document.getElementById(id);
  const AUD = {
    engineers: { name: 'Engineers', fallback: 'h009', tag: 'engineers', clean: ['h012', 'h014', 'h026'], note: 'Read this first: these cards were explored before their thresholds were fixed, so they are not blind pre-registrations. H012, H014 and H026 are the cleanest tests. H016 and H026 are refuted, and those stay on the page.' },
    vcs: { name: 'Deep-tech VCs', fallback: 'h010', tag: 'deep-tech investors' },
    geeks: { name: 'Curious geeks', fallback: 'h011', tag: 'curious readers' }
  };
  const views = ['home', 'aud', 'story', 'hyp', 'explore', 'submit', 'how'];
  const tabOf = { home: 'home', aud: 'home', story: '', hyp: 'home', explore: 'explore', submit: 'submit', how: 'how' };
  function deeper(list, key) {
    const box = $('aud_deeper'); box.replaceChildren();
    if (!list.length) return;
    const h = document.createElement('h3'); h.textContent = 'Go deeper'; box.appendChild(h);
    if (AUD[key].note) { const n = document.createElement('p'); n.className = 'caveat-note'; n.textContent = AUD[key].note; box.appendChild(n); }
    list.forEach(x => { const l = document.createElement('a'); l.href = '#/c/' + x.name.split('-')[0] + '/' + key; l.className = 'deep';
      const t = document.createElement('b'); t.textContent = x.card.title; const v = document.createElement('span'); v.textContent = x.r.verdict === 'inconclusive' ? 'Inconclusive' : (x.r.verdict[0].toUpperCase() + x.r.verdict.slice(1) + ' \u00b7 ' + x.r.confidence);
      const id = x.name.split('-')[0]; if ((AUD[key].clean || []).includes(id)) { const c = document.createElement('i'); c.textContent = 'Cleanest test'; l.appendChild(c); } l.append(t, v); box.appendChild(l); });
  }
  async function single(id, key) {
    const a = AUD[key] || AUD.engineers; $('aud_kicker').textContent = a.name; $('aud_note').textContent = ''; $('aud_deeper').replaceChildren(); $('aud_others').replaceChildren();
    $('aud_back').href = '#/a/' + (AUD[key] ? key : 'engineers');
    $('aud_card').textContent = 'Loading...';
    try { const x = (await HypCards.all()).find(c => c.card && c.name.startsWith(id + '-')); if (!x) throw new Error('not found'); $('aud_card').replaceChildren(HypCards.render(x.card, x.r)); }
    catch (e) { $('aud_card').textContent = 'Could not load this hypothesis: ' + e.message; }
  }
  async function audience(key) {
    $('aud_back').href = '#/';
    const a = AUD[key]; $('aud_kicker').textContent = a.name;
    $('aud_card').textContent = 'Loading...'; $('aud_note').textContent = '';
    $('aud_others').replaceChildren(...Object.keys(AUD).filter(k => k !== key).map(k => { const l = document.createElement('a'); l.href = '#/a/' + k; l.textContent = AUD[k].name + ' \u2192'; return l; }));
    try {
      const list = await HypCards.all(), ok = list.filter(x => x.card);
      const mine = ok.filter(x => x.card.audience === a.tag), own = mine.find(x => x.name.startsWith(a.fallback)) || mine[0], pick = own || ok.find(x => x.name.startsWith(a.fallback));
      if (!pick) throw new Error('no card yet');
      $('aud_card').replaceChildren(HypCards.render(pick.card, pick.r));
      deeper(mine.filter(x => x !== pick), key);
      if (!own) $('aud_note').textContent = 'A card written for this audience is coming. This is the closest tested hypothesis for now.';
    } catch (e) { $('aud_card').textContent = 'Could not load this hypothesis: ' + e.message; }
  }
  let cur;
  function route() {
    const p = (location.hash || '#/').replace(/^#\/?/, '').split('/');
    let v = 'home';
    if (p[0] === 'a' && AUD[p[1]]) v = 'aud'; else if (p[0] === 'c' && /^h\d+$/.test(p[1] || '')) v = 'aud'; else if (['story', 'explore', 'submit', 'how'].includes(p[0])) v = p[0]; else if (p[0] === 'hypotheses') v = 'hyp';
    views.forEach(n => $('v_' + n).hidden = n !== v);
    document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.t === tabOf[v]));
    if (v === 'aud') { if (p[0] === 'c') single(p[1], p[2]); else audience(p[1]); }
    if (cur !== v || v === 'aud') scrollTo({ top: 0, behavior: 'instant' });
    cur = v;
    document.body.dataset.view = v;
    setTimeout(() => { dispatchEvent(new Event('resize')); dispatchEvent(new Event('scroll')); }, 60);
  }
  addEventListener('hashchange', route); route();
})();
