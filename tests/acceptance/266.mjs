// #266 The Saga is the home page; the old home lives at #/compare.
export default async t => {
  await t.open('#/');
  t.ok(((await t.text('#sg1 h1')) || '').length > 10, 'home shows the Saga hook headline');
  await t.open('#/compare');
  t.ok((await t.js("document.getElementById('v_saga').hidden")) === true, 'compare is not the Saga');
};
