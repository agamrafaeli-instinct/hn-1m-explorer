// #421 Explorer: the Copy link button says what it copies.
export default async (t) => {
  await t.open('#/explore?q=a');
  await t.wait(8000);
  t.equal(await t.text('#copyfilters'), 'Copy link to these filters', 'the label says what it copies');
  t.ok(await t.js("document.getElementById('copyfilters').getBoundingClientRect().height>=44"), 'still 44px tall');
  t.ok(await t.js("document.documentElement.scrollWidth<=document.documentElement.clientWidth"), 'the page does not scroll sideways');
};
