// #411 Explorer: active filters as removable chips.
export default async (t) => {
  await t.open('#/explore');
  await t.wait(3000);
  t.ok(await t.js("document.getElementById('fchips').hidden || document.querySelectorAll('#fchips .fchip').length===0"), 'no chips when no filters');
  await t.open('#/explore?q=a&whole=1&min=2');
  await t.wait(8000);
  t.equal(await t.js("[...document.querySelectorAll('#fchips .fchip')].map(b=>b.textContent).join('|')"), 'Word: a \u00d7|Min score: 2 \u00d7|Whole word \u00d7', 'one chip per active filter');
  t.ok(await t.js("[...document.querySelectorAll('#fchips .fchip')].every(b=>b.getBoundingClientRect().height>=44)"), 'chips are 44px tall');
  await t.js("document.querySelectorAll('#fchips .fchip')[1].click()");
  await t.wait(600);
  t.equal(await t.js("document.getElementById('minscore').value"), '0', 'tap clears that filter');
  t.equal(await t.js("document.querySelectorAll('#fchips .fchip').length"), 2, 'its chip is gone');
  t.ok(await t.js("!location.hash.includes('min=')"), 'the address no longer has it');
};
