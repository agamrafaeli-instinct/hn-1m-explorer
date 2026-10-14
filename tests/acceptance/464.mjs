export default async(t)=>{
 await t.open('#/compare?topics=rust,vcdc');
 t.equal(await t.js("[...document.querySelectorAll('#cmp_evidence_links a')].map(a=>a.getAttribute('href')).join('|')"),'#/t/rust|#/t/vcdc','all selected source topics have evidence');
 t.ok((await t.text('#cmp_evidence_links')).includes('data centers'),'word group uses full source label');
 t.ok(await t.js("[...document.querySelectorAll('#cmp_evidence_links a')].every(a=>{const r=a.getBoundingClientRect();return r.height>=44&&r.width>=44})&&document.documentElement.scrollWidth<=innerWidth+1"),'phone evidence links fit');
 await t.click('.cmp_row button');await t.wait(600);
 t.equal(await t.count('#cmp_evidence_links a'),1,'removing a topic updates evidence');
 await t.js("document.querySelector('.cmp_add').value='python';document.querySelector('.cmp_add').dispatchEvent(new Event('change'))");await t.wait(600);
 t.ok(await t.js("[...document.querySelectorAll('#cmp_evidence_links a')].some(a=>a.getAttribute('href')==='#/t/python')"),'adding a topic updates evidence');
};
