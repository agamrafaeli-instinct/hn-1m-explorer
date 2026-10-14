// #425 An unknown address says so and links home.
export default async (t) => {
  await t.open('#/nonsense');
  await t.wait(2500);
  t.ok(await t.js("!document.getElementById('v_nf').hidden && /does not exist/.test(document.getElementById('v_nf').textContent)"), '#/nonsense shows the message');
  t.ok(await t.js("document.getElementById('v_nf').querySelector('a').getBoundingClientRect().height>=43.5"), 'the Home link is 44px tall');
  t.equal(await t.js("document.getElementById('v_nf').querySelector('a').getAttribute('href')"), '#/', 'the link goes to #/');
  await t.open('#/how');
  await t.wait(1500);
  t.ok(await t.js("document.getElementById('v_nf').hidden && !document.getElementById('v_how').hidden"), 'known routes are unchanged');
  await t.open('#/');
  await t.wait(1500);
  t.ok(await t.js("document.getElementById('v_nf').hidden"), 'Home does not show the message');
};
