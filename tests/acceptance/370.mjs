// #370 Share button on the Phoenix and Rings pages.
export default async (t) => {
  for (const r of ['phoenix', 'rings']) {
    await t.open('#/' + r);
    t.equal(await t.count('#v_' + r + ' button[data-share="' + r + '"]'), 1, r + ' has one share button');
    t.ok(await t.js("document.querySelector('#v_" + r + " .pg_share').getBoundingClientRect().height >= 44"), r + ' share button is at least 44px tall');
  }
  await t.open('#/phoenix');
  await t.click('#v_phoenix .pg_share');
  await t.wait(300);
  const label = await t.text('#v_phoenix .pg_share');
  if (label === 'Copy the link below') t.ok(await t.js("(document.querySelector('#v_phoenix input.share_link')||{}).value.includes('share/p/phoenix.html')"), 'copy was blocked, so the link shows in a field to select');
  else t.equal(label, 'Link copied', 'the button says the link was copied');
};
