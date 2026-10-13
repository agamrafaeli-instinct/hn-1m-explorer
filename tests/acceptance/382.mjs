// #382 copy-link button and #383 date range beside the loaded count.
export default async (t) => {
  await t.open('#/explore?q=rust');
  await t.wait(4000);
  t.ok(await t.js("/posts loaded, from \\d{4}-\\d{2}-\\d{2} to \\d{4}-\\d{2}-\\d{2}/.test(document.getElementById('status').textContent)"), 'the status shows the date range of the loaded posts');
  t.ok(await t.js("document.getElementById('copyfilters').getBoundingClientRect().height>=44"), 'copy link button is at least 44px tall');
  await t.click('#copyfilters');
  await t.wait(300);
  const l = await t.text('#copyfilters');
  if (l === 'Copy the link below') t.ok(await t.js("(document.querySelector('input.share_link')||{}).value.includes('q=rust')"), 'copy blocked, so the link shows in a field');
  else t.equal(l, 'Link copied', 'the button says the link was copied');
};
