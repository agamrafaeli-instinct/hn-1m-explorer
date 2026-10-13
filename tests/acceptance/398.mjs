// #398 the Whole word option narrows the word search and is kept in the link.
export default async (t) => {
  await t.open('#/explore?q=an');
  await t.wait(5000);
  const n = () => t.js("+document.getElementById('count').textContent.replace(/[^0-9]/g,'')");
  const c0 = await n();
  await t.js("(()=>{const w=document.getElementById('whole');w.checked=true;w.dispatchEvent(new Event('change',{bubbles:true}))})()");
  await t.wait(800);
  const c1 = await n();
  t.ok(c1 < c0, 'whole word matches fewer titles than any text (' + c0 + ' to ' + c1 + ')');
  t.ok(await t.js("location.hash.includes('whole=1')"), 'the setting is written to the address');
  t.ok(await t.js("document.getElementById('whole').getBoundingClientRect().height>=44||document.querySelector('label.whole').getBoundingClientRect().height>=44"), 'the option has a 44px tap target');
  await t.open('#/explore?q=an&whole=1');
  await t.wait(1500);
  t.ok(await t.js("document.getElementById('whole').checked"), 'a link restores the setting');
};
