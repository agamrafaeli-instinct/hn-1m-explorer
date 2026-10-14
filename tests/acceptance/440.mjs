// Line labels fit the chart. Full names and shares remain accessible.
export default async (t) => {
  for (const route of ['#/t/vcall', '#/compare', '#/compare?topics=cu_languages,gk_science,vcall,aicode,cu_education']) {
    await t.open(route);
    await t.wait(2000);
    const bad = await t.js(`JSON.stringify([...document.querySelectorAll('#cmp .cmp_lb')].filter(e=>{
      const b=e.getBBox(), svg=e.ownerSVGElement.viewBox.baseVal;
      return b.x < 0 || b.x+b.width > svg.width || !e.getAttribute('aria-label') || e.querySelector('title').textContent !== e.getAttribute('aria-label');
    }).map(e=>e.textContent))`);
    t.equal(bad, '[]', route + ': labels fit and have full accessible text');
    t.ok(await t.count('#cmp .cmp_lb') > 0, 'chart has labels');
    t.ok(await t.js('document.documentElement.scrollWidth<=innerWidth+1'), 'no sideways scroll');
  }
  await t.open('#/t/vcall');
  t.ok(await t.js("document.querySelector('.cmp_lb').getAttribute('aria-label').includes('all six deep-tech themes')"), 'full combined theme name kept');
};
