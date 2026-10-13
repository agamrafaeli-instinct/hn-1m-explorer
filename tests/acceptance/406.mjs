// #406 Compare page: share button and share page.
export default async (t) => {
  await t.open('#/compare?topics=rust,python');
  await t.wait(2500);
  t.equal(await t.count('#v_compare button[data-share="compare"]:not([hidden])'), 1, 'one visible Share button on the compare page');
  t.ok(await t.js("document.getElementById('cmp_share').getBoundingClientRect().height>=44"), 'Share button is 44px tall');
  t.ok(await t.js("fetch('share/p/compare.html').then(x=>x.ok?x.text():'').then(x=>x.includes('url=../../#/compare\"')&&/\\d+ topics/.test(x))"), 'share/p/compare.html exists with a topic count');
  await t.open('#/t/rust');
  await t.wait(2500);
  t.ok(await t.js("document.getElementById('cmp_share').hidden"), 'a single topic page has no compare Share button');
  t.ok(await t.js("!/^Compare topics/.test(document.title)"), 'a topic page keeps its own title');
};
