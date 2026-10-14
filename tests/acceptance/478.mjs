export default async(t)=>{
 await t.open('#/saga?beat=sg3');await t.click('#sg3 a[href="#/rings"]');await t.wait(800);
 t.ok(await t.js("document.querySelector('#v_rings .sg_return').hash==='#/saga?beat=sg3'"),'evidence has section return');
 await t.click('#v_rings .sg_return');await t.wait(600);
 t.ok(await t.js("Math.abs(document.getElementById('sg3').getBoundingClientRect().top)<80"),'return restores section');
 t.ok(await t.js("document.querySelector('#sg_map [aria-current]').hash==='#/saga?beat=sg3'"),'map knows section');
 await t.click('#sg3 a[href="#/rings"]');await t.wait(600);await t.js('history.back()');await t.wait(600);
 t.ok(await t.js("location.hash==='#/saga?beat=sg3'&&Math.abs(document.getElementById('sg3').getBoundingClientRect().top)<80"),'browser back restores section');
 await t.js("location.hash='#/'");await t.wait(600);t.ok(await t.js('scrollY<10'),'direct Home resets hook');
};
