// #422 Compare chips are 44px tall and a tap removes the topic and updates the address.
export default async (t) => {
  await t.open('#/compare?topics=rust,python');
  await t.wait(3500);
  const chips = "[...document.querySelectorAll('.cmp_chip')].filter(b=>/\\u00d7/.test(b.textContent))";
  t.equal(await t.js(chips + '.length'), 2, 'two removable chips');
  t.ok(await t.js(chips + '.every(b=>b.getBoundingClientRect().height>=43.5)'), 'chips are at least 44px tall');
  await t.js(chips + "[0].click()");
  await t.wait(1500);
  t.equal(await t.js(chips + '.length'), 1, 'a tap removes one topic');
  t.ok(await t.js("location.hash.indexOf('rust')<0 || location.hash.indexOf('python')<0"), 'the address drops the topic');
  t.equal(await t.js("(location.hash.match(/topics=([^&]*)/)||[0,''])[1].split(',').filter(Boolean).length"), 1, 'one topic left in the address');
};
