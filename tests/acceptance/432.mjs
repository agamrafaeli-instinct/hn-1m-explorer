// #432 Clear buttons for the Author and Domain fields.
export default async (t) => {
  for (const [id, val] of [['by', 'dang'], ['domain', 'github.com']]) {
    const b = "document.getElementById('" + id + "clear')", f = "document.getElementById('" + id + "')";
    await t.open('#/explore?' + id + '=' + val);
    await t.wait(8000);
    t.ok(await t.js('!' + b + '.hidden && ' + b + '.getBoundingClientRect().height>=43.5 && ' + b + '.getBoundingClientRect().width>=43.5'), id + ': button shows at 44px with text');
    t.ok(await t.js("(()=>{const i=" + f + ".getBoundingClientRect(),c=" + b + ".getBoundingClientRect();return c.right<=i.right+1&&c.left>=i.left})()"), id + ': button sits inside the field');
    await t.js(b + '.click()');
    await t.wait(1200);
    t.equal(await t.js(f + '.value'), '', id + ': tap clears the field');
    t.ok(await t.js(b + '.hidden'), id + ': button hides again');
    t.ok(await t.js("location.hash.indexOf('" + id + "=')<0"), id + ': the address drops it');
  }
};
