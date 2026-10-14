// #426 Topics rows show the ratio from data/topic_series.json as text.
export default async (t) => {
  await t.open('#/topics');
  await t.wait(3500);
  const want = await t.js("fetch('data/topic_series.json').then(r=>r.json()).then(d=>d.topics.filter(x=>x.ratio).map(x=>x.id+'='+(x.ratio>=10?x.ratio.toFixed(0):x.ratio.toFixed(1))+'x the earlier share').sort().join('|'))");
  const got = await t.js("[...document.querySelectorAll('#topics_list .tp_row')].filter(r=>r.querySelector('.tp_ratio')).map(r=>r.getAttribute('href').slice(4)+'='+r.querySelector('.tp_ratio').textContent).sort().join('|')");
  t.ok(want.length > 0, 'the data has ratios');
  t.equal(got, want, 'every row with a ratio shows the same text as the data');
  t.ok(await t.js("[...document.querySelectorAll('#topics_list .tp_row')].every(r=>r.getBoundingClientRect().height>=43.5)"), 'rows stay 44px tall');
  t.ok(await t.js("document.documentElement.scrollWidth<=innerWidth+1"), 'no sideways scroll');
};
