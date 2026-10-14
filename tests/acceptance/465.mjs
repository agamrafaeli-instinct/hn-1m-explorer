export default async(t)=>{
 await t.open('#/compare');
 await t.js("window.fetch465=fetch;window.block465=true;window.download465=0;window.csv465=null;fetch=(url,...a)=>String(url).includes('film_shares.json')&&window.block465?Promise.resolve({ok:false}):window.fetch465(url,...a);URL.createObjectURL=b=>{window.csv465=b;window.download465++;return 'blob:test'};URL.revokeObjectURL=()=>{};HTMLAnchorElement.prototype.click=function(){};location.hash='#/t/rust'");await t.wait(1500);await t.click('#cmp_csv');await t.wait(700);
 t.ok((await t.text('.cmp_evidence')).includes('unavailable'),'failed source has honest download note');
 t.equal(await t.js('window.download465'),0,'failed source does not export');
 t.equal(await t.js("document.getElementById('cmp_csv').disabled"),false,'failed download re-enables control');
 await t.js('window.block465=false');await t.click('#cmp_csv');await t.wait(800);
 t.equal(await t.js('window.download465'),1,'source retry exports once');
 t.ok(await t.js("window.csv465.text().then(x=>x.includes('rust,'))"),'retried export uses valid source');
 await t.open('#/compare');
 await t.js("window.fetch465=fetch;window.download465=0;fetch=async(url,...a)=>{const r=await window.fetch465(url,...a);if(!String(url).includes('film_shares.json'))return r;const f=await r.json();f.terms.rust.pattern='conflicting';return {ok:true,json:async()=>f}};URL.createObjectURL=()=>{window.download465++;return 'blob:test'};location.hash='#/t/rust'");await t.wait(1500);await t.click('#cmp_csv');await t.wait(700);
 t.ok((await t.text('.cmp_evidence')).includes('dictionaries disagree'),'conflicting matcher is explicit');
 t.equal(await t.js('window.download465'),0,'conflicting dictionary does not export');
 t.equal(await t.js("document.getElementById('cmp_csv').disabled"),false,'conflict re-enables control');
 await t.open('#/t/rust');await t.wait(1000);
 await t.js("window.download465=0;URL.createObjectURL=()=>{window.download465++;return 'blob:test'};URL.revokeObjectURL=()=>{};HTMLAnchorElement.prototype.click=function(){}");await t.click('#cmp_csv');await t.wait(700);
 t.equal(await t.js('window.download465'),1,'valid source after conflict exports');
};
