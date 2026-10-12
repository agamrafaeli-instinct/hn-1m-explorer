// #256 Audience pages are gone: one card list at #/hypotheses, old audience links redirect there.
export default async t => {
  await t.open('#/hypotheses');
  t.ok((await t.count('.hy_card, .card, article')) > 20, 'the card list shows many cards');
  t.ok(((await t.text('body')) || '').includes('How to read these cards'), 'the how-to-read note is on the list');
  await t.open('#/a/engineers');
  t.equal(await t.js('location.hash'), '#/hypotheses', 'an old audience link lands on the card list');
};
