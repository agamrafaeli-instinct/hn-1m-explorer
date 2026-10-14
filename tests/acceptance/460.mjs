export default async(t)=>{
 await t.open('#/compare?topics=rust,python');
 const text=await t.text('#cmp_meaning');
 t.ok(text.includes('all story titles that month')&&text.includes('six monthly shares')&&text.includes('pool counts'), 'monthly and pooled denominators');
 t.ok(text.includes('Topics overlap')&&text.includes('not a split'), 'overlapping topic scope');
 t.equal(await t.js("document.querySelector('#cmp_meaning a').getAttribute('href')"),'#/how','method link');
 t.ok(await t.js("(()=>{const c=document.querySelector('.cmp_box svg').getBoundingClientRect(),r=document.querySelector('.cmp_row').getBoundingClientRect(),n=document.getElementById('cmp_meaning').getBoundingClientRect();return c.bottom<=r.top&&r.bottom<=n.top&&document.documentElement.scrollWidth<=innerWidth+1})()"),'phone chart and note do not overlap');
};
