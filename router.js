'use strict';
// Hash router: one view at a time, so every page is short and phone-first.
(function () {
  const $ = id => document.getElementById(id);
  const AUD = {
    engineers: { name: 'Engineers', fallback: 'h009', tag: 'engineers' },
    vcs: { name: 'Deep-tech VCs', fallback: 'h010', tag: 'deep-tech investors' },
    geeks: { name: 'Curious geeks', fallback: 'h011', tag: 'curious readers' }
  };
  const views = ['home', 'aud', 'story', 'hyp', 'explore', 'submit', 'how'];
  const tabOf = { home: 'home', aud: 'home', story: 'home', hyp: 'home', explore: 'explore', submit: 'submit', how: 'how' };
  async function audience(key) {
    const a = AUD[key]; $('aud_kicker').textContent = a.name;
    $('aud_card').textContent = 'Loading...'; $('aud_note').textContent = '';
    $('aud_others').replaceChildren(...Object.keys(AUD).filter(k => k !== key).map(k => { const l = document.createElement('a'); l.href = '#/a/' + k; l.textContent = AUD[k].name + ' \u2192'; return l; }));
    try {
      const list = await HypCards.all(), ok = list.filter(x => x.card);
      const own = ok.find(x => x.card.audience === a.tag), pick = own || ok.find(x => x.card.id && x.name.startsWith(a.fallback));
      if (!pick) throw new Error('no card yet');
      $('aud_card').replaceChildren(HypCards.render(pick.card, pick.r));
      if (!own) $('aud_note').textContent = 'A card written for this audience is coming. This is the closest tested hypothesis for now.';
    } catch (e) { $('aud_card').textContent = 'Could not load this hypothesis: ' + e.message; }
  }
  let cur;
  function route() {
    const p = (location.hash || '#/').replace(/^#\/?/, '').split('/');
    let v = 'home';
    if (p[0] === 'a' && AUD[p[1]]) v = 'aud'; else if (['story', 'explore', 'submit', 'how'].includes(p[0])) v = p[0]; else if (p[0] === 'hypotheses') v = 'hyp';
    views.forEach(n => $('v_' + n).hidden = n !== v);
    document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.t === tabOf[v]));
    if (v === 'aud') audience(p[1]);
    if (cur !== v || v === 'aud') scrollTo({ top: 0, behavior: 'instant' });
    cur = v;
    document.body.dataset.view = v;
    setTimeout(() => { dispatchEvent(new Event('resize')); dispatchEvent(new Event('scroll')); }, 60);
  }
  addEventListener('hashchange', route); route();
})();
