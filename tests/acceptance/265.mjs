// #265 Saga beat 6: a search box and eight links (the eighth, Quiet then back, came with #290) that go further into the site.
export default async t => {
  await t.open('#/');
  t.equal(await t.count('#sg_q'), 1, 'search box is on the home page');
  t.equal(await t.count('#sg9 a'), 8, 'eight links in the doors list');
  await t.js("document.getElementById('sg_q').value='rust'; document.getElementById('sg_q').form.dispatchEvent(new Event('submit',{cancelable:true}))");
  await t.wait(800);
  t.ok((await t.js('location.hash')).startsWith('#/explore?q=rust'), 'the search opens Explorer with the typed word');
};
