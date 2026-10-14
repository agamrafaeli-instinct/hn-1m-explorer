export default async(t)=>{
 await t.open('#/t/rust?base=2010-2012&years=2020-2024');await t.wait(1000);
 const periods=await t.js("[...document.querySelectorAll('.baseline_period')].map(x=>x.textContent).join('|')");
 for(const i of [0,1,2]){
  await t.js(`document.querySelectorAll('.yz_p button')[${i}].click()`);await t.wait(700);
  t.equal(await t.js("[...document.querySelectorAll('.baseline_period')].map(x=>x.textContent).join('|')"),periods,'zoom preset keeps pooled periods '+i);
  t.ok(await t.js("location.hash.includes('base=2010-2012')"),'zoom keeps base '+i);
 }
 await t.js("(()=>{const a=document.querySelector('.yz_s select');a.value='2018';a.onchange.call(a)})()");await t.wait(700);
 t.equal(await t.js("[...document.querySelectorAll('.baseline_period')].map(x=>x.textContent).join('|')"),periods,'manual zoom keeps periods');
 await t.js("Object.defineProperty(navigator,'share',{value:async x=>window.share470=x,configurable:true})");await t.click('#cmp_baseline [data-share]');await t.wait(400);
 const hash=await t.js("window.share470.url.slice(window.share470.url.indexOf('#'))");
 t.ok(hash.includes('base=2010-2012')&&hash.includes('years='),'share keeps both choices '+hash);
 await t.open(hash);await t.wait(1000);
 t.equal(await t.js("[...document.querySelectorAll('.baseline_period')].map(x=>x.textContent).join('|')"),periods,'reload keeps periods and chosen zoom');
};
