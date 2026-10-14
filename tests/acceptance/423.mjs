// #423 Home page: a link to the Method page near the counted numbers.
export default async (t) => {
  await t.open('#/');
  await t.wait(2500);
  t.equal(await t.js("[...document.querySelectorAll('.sg_how a')].map(a=>a.getAttribute('href')+' '+a.textContent).join('|')"), '#/how How these are counted', 'the link is on the home page and goes to the Method page');
  t.ok(await t.js("document.querySelector('.sg_how a').getBoundingClientRect().height>=44"), '44px tap target');
};
