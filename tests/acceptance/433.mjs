// #433 The Topics page says which periods "the earlier share" compares, from the data.
export default async (t) => {
  await t.open('#/topics');
  await t.wait(3500);
  const w = await t.js("fetch('data/topic_series.json').then(r=>r.json()).then(d=>d.windows.latest.concat(d.windows.prior).join('|'))");
  const got = await t.js("(document.getElementById('tp_note').textContent.match(/\\d{4}-\\d{2}/g)||[]).join('|')");
  t.ok(w.length > 10, 'the data has both windows');
  t.equal(got, w, 'the note names the same months as the data');
  t.ok(await t.js("/earlier months/.test(document.getElementById('tp_note').textContent)"), 'the note says what it compares with');
  t.ok(await t.js("document.documentElement.scrollWidth<=innerWidth+1"), 'no sideways scroll');
};
