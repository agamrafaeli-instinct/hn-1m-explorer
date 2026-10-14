export default async(t)=>{
 for(const id of ['h319','h304']){
  await t.open('#/c/'+id);await t.click('.ctx-btn');await t.wait(1000);
  t.equal(await t.js("document.querySelector('.ctx-evidence').getAttribute('href')"),id==='h319'?'#/t/vcdc':'#/t/react','exact source topic evidence '+id);
  t.ok(await t.js("(()=>{const a=document.querySelector('.ctx-evidence'),r=a.getBoundingClientRect();return r.height>=44&&r.width>=44&&document.documentElement.scrollWidth<=innerWidth+1})()"),'phone link fits '+id);
 }
};
