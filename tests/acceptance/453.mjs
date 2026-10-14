export default async (t) => {
  for (const route of ['#/t/rust', '#/t/python']) {
    await t.open(route);
    t.equal(await t.count('#cmp .cmp_browse'), 1, 'topic has browse link');
    t.equal(await t.js("document.querySelector('.cmp_browse').getAttribute('href')"), '#/topics', 'browse destination');
    t.ok(await t.js("(()=>{const r=document.querySelector('.cmp_browse').getBoundingClientRect();return r.height>=44 && r.width>=44})()"), 'browse is a phone tap target');
    t.ok(await t.js("document.querySelector('.cmp_browse').getBoundingClientRect().top < document.querySelector('.cmp_box').getBoundingClientRect().top"), 'browse before chart');
  }
  await t.click('.cmp_browse'); await t.wait(500);
  t.ok(await t.count('#topics_list>a') > 0, 'browse opens list');
  for (const route of ['#/compare', '#/']) {
    await t.open(route);
    t.equal(await t.count('#cmp .cmp_browse'), 0, 'no topic-only link on ' + route);
  }
};
