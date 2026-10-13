// #407 Explorer: sort choice is kept in the address and restored on load.
export default async (t) => {
  await t.open('#/explore?q=a');
  await t.wait(8000);
  t.ok(await t.js("!location.hash.includes('sort=')"), 'default sort leaves the address clean');
  await t.js("(()=>{const s=document.getElementById('sort');s.value='new';s.dispatchEvent(new Event('change'));return 1})()");
  await t.wait(400);
  t.ok(await t.js("location.hash.includes('sort=new')"), 'Newest is written to the address');
  await t.open('#/explore?q=a&sort=old');
  await t.wait(8000);
  t.equal(await t.js("document.getElementById('sort').value"), 'old', 'a link with sort=old opens Oldest');
};
