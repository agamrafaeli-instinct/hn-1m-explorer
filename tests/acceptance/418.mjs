// #418 Explorer remembers the last filters in this tab.
export default async (t) => {
  const q = "document.getElementById('q').value";
  await t.open('#/explore?q=a');
  await t.wait(8000);
  await t.js("location.hash='#/topics'");
  await t.wait(1500);
  await t.js("location.hash='#/explore'");
  await t.wait(3000);
  t.equal(await t.js(q), 'a', 'filters come back after another page');
  await t.js("location.hash='#/explore?q=an'");
  await t.wait(2500);
  t.equal(await t.js(q), 'an', 'a link with its own query wins');
  await t.js("document.getElementById('reset').click()");
  await t.wait(800);
  await t.js("location.hash='#/topics'");
  await t.wait(1500);
  await t.js("location.hash='#/explore'");
  await t.wait(2500);
  t.equal(await t.js(q), '', 'Reset clears what is remembered');
};
