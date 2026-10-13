// #412 Topics page: sort by biggest change, order checked against data/topic_series.json.
export default async (t) => {
  await t.open('#/topics');
  await t.wait(2500);
  const want = JSON.parse(await t.js("fetch('data/topic_series.json').then(r=>r.json()).then(d=>JSON.stringify(d.topics.filter(x=>x.ratio).sort((a,b)=>b.ratio-a.ratio).map(x=>x.id)))"));
  t.equal(await t.count('#tp_sort option'), 3, 'three sort options');
  t.ok(await t.js("document.getElementById('tp_sort').getBoundingClientRect().height>=44"), 'sort control is 44px tall');
  await t.js("(()=>{const s=document.getElementById('tp_sort');s.value='rise';s.dispatchEvent(new Event('change'));return 1})()");
  const got = JSON.parse(await t.js("JSON.stringify([...document.querySelectorAll('#topics_list .tp_row')].map(a=>a.getAttribute('href').slice(4)))"));
  t.equal(got.slice(0, 5).join(','), want.slice(0, 5).join(','), 'Biggest rise puts the highest ratios first');
  await t.js("(()=>{const s=document.getElementById('tp_sort');s.value='fall';s.dispatchEvent(new Event('change'));return 1})()");
  const g2 = JSON.parse(await t.js("JSON.stringify([...document.querySelectorAll('#topics_list .tp_row')].map(a=>a.getAttribute('href').slice(4)))"));
  t.equal(g2[0], want[want.length - 1], 'Biggest fall puts the lowest ratio first');
  t.ok(await t.js("location.hash.includes('sort=fall')"), 'the choice is in the address');
  await t.open('#/topics?sort=rise');
  await t.wait(2500);
  t.equal(await t.js("document.getElementById('tp_sort').value"), 'rise', 'a link with sort=rise opens sorted');
};
