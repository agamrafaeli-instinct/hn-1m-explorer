export default async(t)=>{
 for(const route of ['#/t/vcdc?base=2010-2012','#/compare?topics=rust,vcdc,typescript,cu_languages,gk_science,vcall']){
  await t.open(route);await t.wait(1000);
  t.ok(await t.js('document.documentElement.scrollWidth<=innerWidth+1'),'narrow page fits '+route);
  t.ok(await t.js("(()=>{const c=document.querySelector('.cmp_box svg').getBoundingClientRect(),r=document.querySelector('.cmp_row').getBoundingClientRect(),f=document.querySelector('.cmp_foot').getBoundingClientRect();return c.bottom<=r.top&&r.bottom<=f.top})()"),'chart controls and footer separated');
  t.ok(await t.js("[...document.querySelectorAll('#cmp_baseline select,#cmp_baseline button,#cmp_evidence_links a')].filter(x=>x.getBoundingClientRect().height).every(x=>x.getBoundingClientRect().height>=44)"),'evidence controls have phone targets');
 }
};
