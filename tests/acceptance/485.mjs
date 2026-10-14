export default async(t)=>{
 await t.open('#/saga?beat=sg3');t.ok(await t.js("document.activeElement===document.querySelector('#sg3 h2')"),'section heading focused');await t.click('#sg3 .sg_steps a:last-child');await t.wait(350);t.ok(await t.js("location.hash==='#/saga?beat=sg4'&&document.activeElement===document.querySelector('#sg4 h2')"),'next section focus');t.ok(await t.js("[...document.querySelectorAll('#sg3 .sg_steps a')].every(a=>a.getBoundingClientRect().height>=44)"),'nearby nav phone targets');
};
