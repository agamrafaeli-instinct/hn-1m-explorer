export default async(t)=>{
 await t.open('#/saga?beat=sg3');
 for(const id of ['sg2','sg3','sg4','sg5']){
  const p=await t.js(`fetch('share/p/home-${id}.html').then(r=>r.text())`);
  t.ok(p.includes('../../#/saga?beat='+id),'preview destination '+id);
  const heading=await t.text('#'+id+' h2');
  t.ok(p.includes(heading.replaceAll('&','&amp;')),'preview keeps heading '+id);
  t.ok(p.includes('og:description'),'preview description '+id);
 }
 t.ok(await t.js("fetch('share/p/home.html').then(r=>r.ok)"),'general Home preview stays');
};
