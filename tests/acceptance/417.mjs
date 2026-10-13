// #417 Explorer: Reset shows only when a filter is on.
export default async (t) => {
  await t.open('#/explore');
  await t.wait(3000);
  t.ok(await t.js("document.getElementById('reset').hidden && document.getElementById('reset').getBoundingClientRect().height===0"), 'Reset is hidden with no filters');
  await t.open('#/explore?q=a');
  await t.wait(8000);
  t.ok(await t.js("!document.getElementById('reset').hidden && document.getElementById('reset').getBoundingClientRect().height>=44"), 'Reset shows, 44px tall, with a filter on');
  await t.js("document.getElementById('reset').click()");
  await t.wait(600);
  t.ok(await t.js("document.getElementById('reset').hidden"), 'Reset hides again after it clears the filters');
};
