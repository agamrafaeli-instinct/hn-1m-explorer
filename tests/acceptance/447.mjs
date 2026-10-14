export default async (t) => {
  await t.open('#/t/not-a-real-topic');
  t.equal(await t.text('#cmp h2'), 'Topic not found', 'unknown topic has clear message');
  t.equal(await t.count('#cmp svg'), 0, 'unknown topic shows no unrelated chart');
  t.equal(await t.js("document.querySelector('#cmp a').getAttribute('href')"), '#/topics', 'link back to Topics');
  t.ok(await t.js('document.documentElement.scrollWidth<=innerWidth+1'), 'error fits phone');
  await t.js("location.hash='#/t/rust'"); await t.wait(500);
  t.equal(await t.text('#cmp h2'), 'Rust', 'valid topic recovers');
  t.equal(await t.count('#cmp .cmp_lb'), 1, 'valid topic has one line');
  await t.js("location.hash='#/compare'"); await t.wait(500);
  t.ok(await t.count('#cmp .cmp_lb') > 1, 'default compare unchanged');
};
