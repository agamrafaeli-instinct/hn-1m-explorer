export default async(t)=>{
 await t.open('#/compare');
 await t.js("window.append472=HTMLHeadElement.prototype.appendChild;HTMLHeadElement.prototype.appendChild=function(n){if(n.src&&n.src.includes('topic-period.js')){setTimeout(()=>n.onerror(),0);return n}return window.append472.call(this,n)};location.hash='#/t/rust'");await t.wait(1200);
 t.ok((await t.text('#cmp_baseline')).includes('could not be loaded'),'script failure has honest state');
 t.equal(await t.count('.baseline_period'),0,'script failure invents no period');
 await t.js("HTMLHeadElement.prototype.appendChild=window.append472;location.hash='#/compare'");await t.wait(300);await t.js("location.hash='#/t/rust'");await t.wait(1000);
 t.equal(await t.count('.baseline_period'),2,'returning after script recovery shows periods');
 await t.open('#/compare');
 await t.js("window.fetch472=fetch;window.bad472=true;fetch=(u,...a)=>String(u).includes('film_shares.json')&&window.bad472?Promise.resolve({ok:false}):window.fetch472(u,...a);location.hash='#/t/rust'");await t.wait(1200);
 t.ok((await t.text('#cmp_baseline')).includes('unavailable'),'source failure has honest period state');
 t.equal(await t.count('.baseline_period'),0,'source failure invents no period');
 await t.js("window.bad472=false;location.hash='#/compare'");await t.wait(300);await t.js("location.hash='#/t/rust'");await t.wait(1000);
 t.equal(await t.count('.baseline_period'),2,'source recovery shows valid periods');
 await t.js("window.csv472=0;URL.createObjectURL=()=>{window.csv472++;return 'blob:test'};URL.revokeObjectURL=()=>{};HTMLAnchorElement.prototype.click=function(){}");await t.click('#cmp_csv');await t.wait(600);
 t.equal(await t.js('window.csv472'),1,'CSV works after period recovery');
};
