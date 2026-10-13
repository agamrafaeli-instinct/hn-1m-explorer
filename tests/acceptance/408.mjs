// #408 Hypotheses cards: one-word topic cards link to the Explorer, whole word. Word-group cards get no link.
export default async (t) => {
  await t.open('#/c/h318');
  await t.wait(4000);
  t.equal(await t.js("[...document.querySelectorAll('#v_aud a.ctx-find')].map(a=>a.getAttribute('href')).join(' ')"), '#/explore?q=java&whole=1', 'the Java card links to the whole-word search');
  t.ok(await t.js("[...document.querySelectorAll('#v_aud a.ctx-find')].every(a=>a.getBoundingClientRect().height>=44)"), 'link is 44px tall');
  await t.js("document.querySelector('#v_aud .ctx-btn').click()");
  await t.wait(1500);
  t.equal(await t.count('#v_aud a.ctx-find'), 1, 'the link stays after the monthly line loads');
  await t.open('#/c/h308');
  await t.wait(4000);
  t.equal(await t.count('#v_aud a.ctx-find'), 0, 'a word-group card has no link');
};
