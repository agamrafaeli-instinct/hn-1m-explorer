// #427 A 44px clear button inside the Word field.
export default async (t) => {
  const b = "document.getElementById('qclear')";
  await t.open('#/explore');
  await t.wait(3500);
  t.ok(await t.js(b + '.hidden'), 'no button with an empty field');
  await t.open('#/explore?q=a');
  await t.wait(8000);
  t.ok(await t.js('!' + b + '.hidden && ' + b + '.getBoundingClientRect().height>=43.5 && ' + b + '.getBoundingClientRect().width>=43.5'), 'button shows, 44px, with text');
  t.ok(await t.js("(()=>{const i=document.getElementById('q').getBoundingClientRect(),c=" + b + ".getBoundingClientRect();return c.right<=i.right+1&&c.left>=i.left})()"), 'button sits inside the field');
  await t.js(b + '.click()');
  await t.wait(1200);
  t.equal(await t.js("document.getElementById('q').value"), '', 'tap clears the field');
  t.ok(await t.js(b + '.hidden'), 'button hides again');
  t.ok(await t.js("location.hash.indexOf('q=')<0"), 'the address drops the word');
};
