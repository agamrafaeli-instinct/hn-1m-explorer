// #390 one-word Rings themes link to the Explorer search.
export default async (t) => {
  await t.open('#/rings');
  t.equal(await t.js("[...document.querySelectorAll('#v_rings .rg_find a')].map(a=>a.getAttribute('href')).join(' ')"), '#/explore?q=python #/explore?q=react #/explore?q=rust #/explore?q=kubernetes', 'four one-word themes link to the Explorer');
  t.ok(await t.js("[...document.querySelectorAll('#v_rings .rg_find a')].every(a=>a.getBoundingClientRect().height>=44)"), 'links are at least 44px tall');
};
