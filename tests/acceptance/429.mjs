// #429 One comment reads "1 comment" in the Explorer rows.
export default async (t) => {
  await t.open('#/explore?q=a');
  await t.wait(8000);
  t.ok(await t.js("!/\\b1 comments\\b/.test(document.getElementById('list').textContent)"), 'no "1 comments" in the list');
  t.ok(await t.js("/\\b[02-9]\\d* comments\\b/.test(document.getElementById('list').textContent)"), 'other counts keep the plural');
};
