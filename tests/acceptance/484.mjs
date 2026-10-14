export default async(t)=>{
 await t.open('#/saga?beat=missing');t.ok(await t.js("document.getElementById('sg_unknown').textContent.includes('not available')&&scrollY<10"),'unknown section explained');await t.click('#sg_unknown a');await t.wait(300);t.ok(await t.js("!document.getElementById('sg_unknown')"),'opening clears notice');
};
