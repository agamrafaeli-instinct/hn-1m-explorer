// Shared Explorer links preserve the loaded slice, using only offered sizes.
const settled = async t => {
  for (let i = 0; i < 100; i++) {
    if (await t.js("!busy && loadedSize > 0")) return;
    await t.wait(300);
  }
  throw Error('Explorer load did not finish');
};
export default async (t) => {
  await t.open('#/explore?q=a'); await settled(t);
  const small = await t.js("document.getElementById('loadn').options[0].value");
  t.equal(await t.js('String(loadedSize)'), small, 'no size opens smallest slice');
  const initial = await t.js('D.n');
  await t.click('#moreslice_btn'); await settled(t);
  const larger = await t.js('String(loadedSize)'), count = await t.js('D.n');
  t.ok(count >= initial, 'Search more loads at least as many posts');
  t.equal(await t.js("new URLSearchParams(location.hash.split('?')[1]).get('size')"), larger, 'address carries loaded size');
  await t.js("Object.defineProperty(navigator,'clipboard',{value:{writeText:async u=>{window.copied435=u}},configurable:true})");
  await t.click('#copyfilters');
  const copied = await t.js('window.copied435');
  t.ok(copied.includes('size=' + larger), 'Copy link includes size');
  await t.open(copied.slice(copied.indexOf('#'))); await settled(t);
  t.equal(await t.js('String(loadedSize)'), larger, 'copied link reopens same slice');
  t.equal(await t.js('D.n'), count, 'same loaded post count');
  await t.open('#/explore?q=a&size=999999'); await settled(t);
  t.equal(await t.js('String(loadedSize)'), small, 'unoffered size falls back to smallest');
  t.ok(await t.js('document.documentElement.scrollWidth<=innerWidth+1'), 'no sideways scroll');
};
