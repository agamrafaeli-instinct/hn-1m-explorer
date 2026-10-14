export default async (t) => {
  for (const q of ['', 'rust', 'typescript', 'no-topic-with-this-name']) {
    await t.open('#/topics' + (q ? '?q=' + q : ''));
    const n = await t.js("[...document.querySelectorAll('#topics_list>a')].filter(e=>!e.hidden).length"), total = await t.count('#topics_list>a');
    t.equal(await t.text('#tp_count'), q ? n + ' of ' + total + ' topics match.' : total + ' topics.', 'count matches visible rows: ' + q);
    t.equal(await t.js("document.getElementById('tp_count').getAttribute('aria-live')"), 'polite', 'polite count updates');
  }
  await t.js("document.getElementById('tp_q').value='';document.getElementById('tp_q').dispatchEvent(new Event('input'))");
  t.equal(await t.text('#tp_count'), (await t.count('#topics_list>a')) + ' topics.', 'clear restores total');
  t.ok(await t.js('document.documentElement.scrollWidth<=innerWidth+1'), 'no sideways scroll');
};
