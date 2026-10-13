// #392 the Method page lists what the numbers cannot tell you.
export default async (t) => {
  await t.open('#/how');
  t.ok(await t.js("document.querySelectorAll('#how_limits li').length>=4"), 'the limits list has at least four items');
  t.ok(await t.js("[...document.querySelectorAll('#how_limits li')].every(l=>/\\((data|docs)\\//.test(l.textContent))"), 'each limit names its source file');
  t.ok(await t.js("document.documentElement.scrollWidth<=innerWidth"), 'no sideways scroll at 390 px');
};
