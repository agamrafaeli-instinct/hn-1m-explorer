// #388 zero-match message and #389 sort kept in the link.
export default async (t) => {
  await t.open('#/explore?q=zzzqqqxx&min=5&sort=new');
  await t.wait(5000);
  t.equal(await t.js("document.getElementById('sort').value"), 'new', 'a link restores the sort order');
  t.ok(await t.js("(document.getElementById('nomatch').textContent||'').includes('Word \"zzzqqqxx\"') && !document.getElementById('nomatch').hidden"), 'zero results names the active filters');
  t.ok(await t.js("document.querySelector('#nomatch button').getBoundingClientRect().height>=44"), 'the reset button is at least 44px tall');
  await t.click('#nomatch button');
  await t.wait(600);
  t.ok(await t.js("document.getElementById('nomatch').hidden && document.getElementById('q').value===''"), 'reset clears the filters and hides the message');
  await t.js("(()=>{const s=document.getElementById('sort');s.value='old';s.dispatchEvent(new Event('change',{bubbles:true}))})()");
  await t.wait(300);
  t.ok(await t.js("location.hash.includes('sort=old')"), 'changing the sort writes it to the address');
};
