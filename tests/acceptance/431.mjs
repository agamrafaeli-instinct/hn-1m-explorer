// #431 The match count sits directly above the post list.
export default async (t) => {
  await t.open('#/explore?q=a');
  await t.wait(8000);
  t.ok(await t.js("document.getElementById('rcount').nextElementSibling===document.getElementById('list')"), 'count line sits directly above the list');
  const n = await t.js("document.getElementById('count').textContent.replace(/\\D/g,'')");
  t.ok(await t.js("/^[0-9,]+ posts? match(es)? these filters\\.$/.test(document.getElementById('rcount').textContent)"), 'reads N posts match these filters, with commas');
  t.equal(await t.js("document.getElementById('rcount').textContent.replace(/\\D/g,'')"), n, 'same number as the summary count');
};
