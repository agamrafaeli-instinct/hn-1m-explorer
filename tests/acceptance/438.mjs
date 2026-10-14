// Every topic shows the exact title matching pattern, with no sideways scroll.
export default async (t) => {
  await t.open('#/t/rust');
  await t.wait(3500);
  const topics = JSON.parse(await t.js("fetch('data/topic_series.json').then(r=>r.json()).then(d=>JSON.stringify(d.topics.map(x=>({id:x.id,matcher:x.matcher}))))"));
  for (const topic of topics) {
    await t.js(`location.hash = '#/t/${topic.id}'`);
    await t.wait(200);
    t.equal(await t.text('#cmp_words .cmp_matcher'), topic.matcher, topic.id + ': exact pattern');
    t.ok(await t.js("document.documentElement.scrollWidth<=innerWidth+1"), topic.id + ': no sideways scroll');
  }
  t.ok(await t.text('#cmp_words').then(x => x.includes('ignoring case')), 'explains title matching');
  await t.js("location.hash = '#/compare?topics=rust,go'");
  await t.wait(300);
  t.equal(await t.count('#cmp_words'), 0, 'single-topic rule not shown on multi-topic compare');
};
