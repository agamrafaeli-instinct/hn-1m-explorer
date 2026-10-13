// #394 topic page and #395 compare page: plain one-word topics link to the Explorer with whole word on.
export default async (t) => {
  await t.open('#/t/rust');
  await t.wait(2500);
  t.equal(await t.js("[...document.querySelectorAll('#v_compare .cmp_find a')].map(a=>a.getAttribute('href')).join(' ')"), '#/explore?q=rust&whole=1', 'the Rust page links to the Explorer, whole word');
  await t.open('#/t/sql');
  await t.wait(2500);
  t.ok(await t.js("document.getElementById('cmp_find').hidden && document.querySelectorAll('#cmp_find a').length===0"), 'a word group has no search link');
  await t.open('#/compare?topics=rust,python,sql');
  await t.wait(2500);
  t.equal(await t.js("[...document.querySelectorAll('#v_compare .cmp_find a')].map(a=>a.getAttribute('href')).join(' ')"), '#/explore?q=rust&whole=1 #/explore?q=python&whole=1', 'compare links the one-word topics only');
  t.ok(await t.js("(document.querySelector('#v_compare .cmp_find')||{textContent:''}).textContent.includes('word groups have no link')"), 'the page says word groups have no link');
  t.ok(await t.js("[...document.querySelectorAll('#v_compare .cmp_find a')].every(a=>a.getBoundingClientRect().height>=44)"), 'links are 44px tall');
};
