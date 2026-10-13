// #371 The Method page names the sources for the concentration and comeback numbers.
export default async (t) => {
  await t.open('#/how');
  const txt = (await t.text('#v_how')) || '';
  t.ok(txt.includes('data/atlas/concentration.json'), 'names the concentration file');
  t.ok(txt.includes('data/resurfacing/groups.json'), 'names the comeback file');
  t.ok(txt.includes('docs/RESURFACING_SPEC.md'), 'names the rules written before the run');
  t.ok(await t.js("document.documentElement.scrollWidth <= window.innerWidth"), 'no sideways scroll at 390 px');
};
