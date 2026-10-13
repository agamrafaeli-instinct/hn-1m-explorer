// #384 Search link under each comeback chart; #385 jump link from the held count to the table.
export default async (t) => {
  await t.open('#/phoenix');
  t.equal(await t.js("document.querySelectorAll('#v_phoenix .ph_fig a.ph_find[href^=\"#/explore?q=\"]').length"), 3, 'each of the three charts links to the Explorer search');
  t.ok(await t.js("document.querySelector('#v_phoenix .ph_find').getBoundingClientRect().height>=44"), 'the search link is at least 44px tall');
  await t.js("window.scrollTo(0,0)");
  await t.click('#v_phoenix a[data-jump=\"ph_sharp\"]');
  await t.wait(1200);
  t.ok(await t.js("Math.abs(document.getElementById('ph_sharp').getBoundingClientRect().top)<200"), 'the held count scrolls to the sharp returns table');
  t.ok(await t.js("location.hash==='#/phoenix'"), 'the address stays on the page');
  await t.click('#v_phoenix a[data-jump=\"v_phoenix\"]');
  await t.wait(1200);
  t.ok(await t.js("window.scrollY<200"), 'back to the top works');
};
