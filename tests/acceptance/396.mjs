// #396 every chart SVG on the main pages has a role and a label, or is marked decorative.
export default async (t) => {
  for (const r of ['#/', '#/rings', '#/phoenix', '#/explore', '#/topics', '#/compare', '#/story', '#/how', '#/hypotheses']) {
    await t.open(r);
    await t.wait(2500);
    const bad = await t.js("JSON.stringify([...document.querySelectorAll('svg')].filter(s=>!s.closest('[hidden]')).filter(s=>s.getAttribute('aria-hidden')!=='true'&&!(s.getAttribute('role')==='img'&&(s.getAttribute('aria-label')||'').trim())).map(s=>(s.id||s.parentElement.id||s.parentElement.className||'svg')+'').slice(0,6))");
    t.equal(bad, '[]', r + ' has no unlabeled chart');
  }
};
