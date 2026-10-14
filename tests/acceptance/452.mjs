export default async (t) => {
  await t.open('#/t/rust');
  const topics = JSON.parse(await t.js("fetch('data/topic_series.json').then(r=>r.json()).then(d=>JSON.stringify(d.topics.slice().sort((a,b)=>b.matcher.length-a.matcher.length).slice(0,1).concat(d.topics.find(x=>x.id==='rust'))))"));
  for (const topic of topics) {
    await t.js(`location.hash='#/t/${topic.id}'`); await t.wait(400); await t.click('.cmp_det');
    t.equal(await t.text('dialog .cmp_matcher'), topic.matcher, topic.id + ': exact pattern');
    t.ok(await t.js("document.querySelector('dialog').scrollWidth<=document.querySelector('dialog').clientWidth+1"), 'no horizontal dialog overflow');
    t.ok(await t.js("document.documentElement.scrollWidth<=innerWidth+1"), 'no page overflow');
    await t.js("document.querySelector('dialog button').scrollIntoView()");
    t.ok(await t.js("(()=>{const r=document.querySelector('dialog button').getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight})()"), 'Close reachable');
    await t.click('dialog button'); await t.wait(100);
  }
};
