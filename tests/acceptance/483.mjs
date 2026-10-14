export default async(t)=>{
 await t.open('#/saga?beat=sg_shelf');await t.click('#sg_shelf a[href="#/rings"]');await t.wait(400);t.ok(await t.js("document.querySelector('.sg_return').hash==='#/saga?beat=sg_shelf'"),'shelf return route');await t.click('.sg_return');await t.wait(400);t.ok(await t.js("Math.abs(document.getElementById('sg_shelf').getBoundingClientRect().top)<80"),'returns shelf');
};
