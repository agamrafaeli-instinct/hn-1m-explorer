// #420 Explorer: a link opens the small slice, so say so and offer to search more.
export default async (t) => {
  await t.open('#/explore?q=a&whole=1');
  await t.wait(8000);
  const n0 = await t.js("D.n");
  t.ok(await t.js("!document.getElementById('moreslice').hidden && /^Searching only the newest [\\d,]+ posts/.test(document.getElementById('moreslice_t').textContent)"), 'the line says only the newest posts are searched');
  t.ok(await t.js("/^Search more \\(about \\d+ ?[KM]B\\)$/.test(document.getElementById('moreslice_btn').textContent)"), 'the button shows a size from the manifest');
  t.ok(await t.js("document.getElementById('moreslice_btn').getBoundingClientRect().height>=44"), 'the button is 44px tall');
  await t.js("document.getElementById('moreslice_btn').click()");
  await t.wait(45000);
  t.ok((await t.js("D.n")) > n0, 'more posts are loaded');
  t.ok(await t.js("document.getElementById('moreslice').hidden"), 'the line is gone once the larger slice is loaded');
  t.equal(await t.js("document.getElementById('q').value+' '+document.getElementById('whole').checked"), 'a true', 'the filters are kept');
};
