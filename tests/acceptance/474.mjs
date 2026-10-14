export default async(t)=>{
 await t.open('#/');
 t.equal(await t.count('.sg_map a'),5,'map offers all existing beats');
 t.ok(await t.js("[...document.querySelectorAll('.sg_map a')].every(a=>document.getElementById(a.dataset.jump)&&a.getBoundingClientRect().height>=44)"),'existing beat IDs and phone targets');
 await t.click('.sg_map a[data-jump="sg4"]');await t.wait(1200);
 t.ok(await t.js("document.getElementById('sg4').getBoundingClientRect().top<100&&document.body.dataset.view==='saga'"),'jump shows findings in Home');
 t.ok(await t.js('document.documentElement.scrollWidth<=innerWidth+1'),'map has no sideways overflow');
};
