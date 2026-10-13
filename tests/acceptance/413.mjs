// #413 Method page: when the data was built and how many posts, from the manifest.
export default async (t) => {
  await t.open('#/how');
  await t.wait(2500);
  const r = JSON.parse(await t.js("fetch('data/manifest.json').then(r=>r.json()).then(m=>JSON.stringify({d:m.generated_at.slice(0,10),n:m.total_rows.toLocaleString('en-US'),txt:document.getElementById('how_built').textContent,hid:document.getElementById('how_built').hidden}))"));
  t.ok(!r.hid, 'the line is shown');
  t.ok(r.txt.includes(r.d) && r.txt.includes(r.n), 'the date and row count match the manifest');
};
