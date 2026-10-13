// #414 Rings page: a link per year to the Explorer, with the date range checked against the year list.
export default async (t) => {
  await t.open('#/rings');
  await t.wait(3500);
  const years = JSON.parse(await t.js("fetch('data/rings.json').then(r=>r.json()).then(d=>JSON.stringify(d.years))"));
  t.equal(await t.count('#v_rings .rg_years a'), years.length, 'one link per year');
  const y0 = years[0], y1 = years[years.length - 1];
  t.equal(await t.js("[...document.querySelectorAll('#v_rings .rg_years a')].map(a=>a.getAttribute('href')).filter((h,i,a)=>i===0||i===a.length-1).join(' ')"), `#/explore?from=${y0}-01-01&to=${y0}-12-31&sort=score #/explore?from=${y1}-01-01&to=${y1}-12-31&sort=score`, 'first and last link carry that year\'s date range');
  t.ok(await t.js("[...document.querySelectorAll('#v_rings .rg_years a')].every(a=>{const b=a.getBoundingClientRect();return b.height>=44&&b.width>=44})"), 'every link is 44px both ways');
  await t.open('#/explore?from=2010-01-01&to=2010-12-31&sort=score');
  await t.wait(8000);
  t.equal(await t.js("document.getElementById('from').value+' '+document.getElementById('to').value+' '+document.getElementById('sort').value"), '2010-01-01 2010-12-31 score', 'the Explorer opens with that range');
};
