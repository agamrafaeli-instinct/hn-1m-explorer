export default async(t)=>{
 await t.open('#/');await t.wait(700);
 t.equal(await t.count('.sg_shelf a'),3,'existing story choices');
 t.equal(await t.js("[...document.querySelectorAll('.sg_shelf a')].map(a=>a.getAttribute('href')).join('|')"),'#/rings|#/phoenix|#/c/h319','existing source routes');
 t.ok(await t.js("fetch('stories/h319.json').then(r=>r.json()).then(c=>document.querySelector('#sg_card_pick b').textContent===c.question)"),'card question from source');
 t.ok(await t.js("['sg2','sg3','sg4','sg5','sg9'].every(id=>!!document.getElementById(id))"),'essay beats kept');
 t.ok(await t.js("document.documentElement.scrollWidth<=innerWidth+1&&[...document.querySelectorAll('.sg_shelf a')].every(a=>a.getBoundingClientRect().height>=44)"),'phone shelf fits');
};
