export default async (t) => {
  await t.open('#/c/h423'); await t.wait(1500);
  t.ok((await t.text('#aud_card')).includes('Vue-to-React'), 'new card question names comparison');
  t.ok((await t.text('#aud_card')).includes('overlap'), 'caveat explains overlap');
  t.ok(await t.js("fetch('data/honor.json').then(r=>r.json()).then(d=>d.cards.find(x=>x.id==='h423').failing.length===0)"), 'new card passes all scored criteria');
  t.ok(await t.js("fetch('hypotheses/h423-vue-react-ratio.json').then(r=>r.json()).then(c=>c.replaces==='h422'&&c.check.group_a.per==='react_s'&&c.check.group_b.per==='react_s')"), 'new denominator with replacement link');
  t.ok(await t.js('document.documentElement.scrollWidth<=innerWidth+1'), 'no sideways scroll');
};
