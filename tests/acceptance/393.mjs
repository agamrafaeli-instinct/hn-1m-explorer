// #393 the home story has a Share button and a share page.
export default async (t) => {
  await t.open('#/');
  t.equal(await t.count('#sg9 button[data-share="home"]'), 1, 'home has one share button');
  t.ok(await t.js("document.querySelector('#sg9 .pg_share').getBoundingClientRect().height>=44"), 'the button is at least 44px tall');
  const r = await t.js("fetch('share/p/home.html').then(r=>r.ok?r.text():'').then(x=>/543,583|sites, and the top 1%/.test(x)&&x.includes('url=../../#/\"'))");
  t.ok(r, 'the share page exists and carries the number');
};
