export default async (t) => {
  await t.open('#/t/rust');
  t.equal(await t.count('.cmp_row button[aria-label^="Remove "]'), 0, 'sole topic has no remove button');
  t.equal(await t.count('.cmp_row span[aria-label="Selected topic: Rust"]'), 1, 'sole topic is a labelled span');
  t.equal(await t.count('.cmp_add'), 1, 'add-topic control remains');
  await t.js("document.querySelector('.cmp_add').value='python';document.querySelector('.cmp_add').dispatchEvent(new Event('change'))");
  await t.wait(700);
  t.equal(await t.count('.cmp_row button[aria-label^="Remove "]'), 2, 'both topics removable');
  await t.click('.cmp_row button[aria-label="Remove Rust"]');
  await t.wait(700);
  t.equal(await t.count('.cmp_lb'), 1, 'only one chart line remains');
  t.equal(await t.js("new URLSearchParams(location.hash.split('?')[1]).get('topics')"), 'python', 'remaining topic kept without defaults');
  t.equal(await t.count('.cmp_row button[aria-label^="Remove "]'), 0, 'last topic becomes a label');
  t.equal(await t.count('.cmp_row span[aria-label="Selected topic: Python"]'), 1, 'remaining label names Python');
  t.ok(await t.js('document.documentElement.scrollWidth<=innerWidth+1'), 'no sideways scroll');
};
