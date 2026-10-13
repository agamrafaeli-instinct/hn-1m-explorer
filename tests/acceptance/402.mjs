// #402 Explorer: tap a bar in the domains or authors chart to filter.
export default async (t) => {
  await t.open('#/explore?q=a');
  await t.wait(8000);
  const tap = (id) => "(()=>{const c=Chart.getChart('" + id + "'),b=c.getDatasetMeta(0).data[0],r=c.canvas.getBoundingClientRect(),x=r.left+(b.x+b.base)/2,y=r.top+b.y;const o={bubbles:true,clientX:x,clientY:y};c.canvas.dispatchEvent(new MouseEvent('mousemove',o));c.canvas.dispatchEvent(new MouseEvent('click',o));return c.data.labels[0]})()";
  const dom = await t.js(tap('c_dom'));
  await t.wait(800);
  t.equal(await t.js("document.getElementById('domain').value"), dom, 'a tap on the top domain bar sets the Domain filter');
  t.ok(await t.js("location.hash.includes('domain=')"), 'the address holds the domain');
  await t.open('#/explore?q=a');
  await t.wait(8000);
  const au = await t.js(tap('c_auth'));
  await t.wait(800);
  t.equal(await t.js("document.getElementById('by').value"), au, 'a tap on the top author bar sets the Author filter');
  t.ok(await t.js("location.hash.includes('by=')"), 'the address holds the author');
};
