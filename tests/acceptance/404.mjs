// #404 Topics page: search box to find a topic.
export default async (t) => {
  await t.open('#/topics');
  await t.wait(2500);
  const all = await t.count('#topics_list .tp_row');
  t.ok(all > 20, 'the list has many topics');
  t.ok(await t.js("(()=>{const q=document.getElementById('tp_q');q.value='rust';q.dispatchEvent(new Event('input'));return 1})()"), 'typed');
  t.equal(await t.js("[...document.querySelectorAll('#topics_list .tp_row')].filter(r=>!r.hidden).map(r=>r.querySelector('b').textContent.toLowerCase().includes('rust')).every(Boolean)"), true, 'only matching topics show');
  t.ok(await t.js("[...document.querySelectorAll('#topics_list .tp_row')].filter(r=>!r.hidden).length>=1"), 'rust is found');
  await t.js("(()=>{const q=document.getElementById('tp_q');q.value='zzqq';q.dispatchEvent(new Event('input'));return 1})()");
  t.ok(await t.js("!document.getElementById('tp_none').hidden"), 'an empty result says no topic matches');
  t.ok(await t.js("(()=>{const q=document.getElementById('tp_q');return q.getBoundingClientRect().height>=44&&parseFloat(getComputedStyle(q).fontSize)>=16})()"), '44px field, 16px text');
};
