// #399 Explorer: Download CSV of the current matches.
export default async (t) => {
  await t.open('#/explore?q=rust&whole=1');
  await t.wait(6000);
  await t.js("(()=>{const o=URL.createObjectURL.bind(URL);window.__csv='';URL.createObjectURL=b=>{b.text().then(x=>window.__csv=x);return o(b)};document.getElementById('csv').click();return 1})()");
  await t.wait(800);
  const lines = await t.js("window.__csv.split('\\r\\n').filter(Boolean).length");
  const n = await t.js("+document.getElementById('count').textContent.replace(/[^0-9]/g,'')");
  t.ok(await t.js("window.__csv.replace(/^\\ufeff/,'').startsWith('id,date,score,comments,author,domain,title')"), 'CSV has the header');
  t.equal(lines, Math.min(n, 50000) + 1, 'one row per match plus the header');
  t.ok(await t.js("(document.getElementById('csvnote').textContent||'').startsWith('Saved')"), 'a note says how many were saved');
  t.ok(await t.js("document.getElementById('csv').getBoundingClientRect().height>=44"), '44px tap target');
};
