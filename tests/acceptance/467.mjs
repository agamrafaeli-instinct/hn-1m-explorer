export default async(t)=>{
 await t.open('#/t/rust?base=2010-2012&years=2020-2024');await t.wait(1000);
 const before=await t.text('#cmp_baseline');
 await t.js("window.copy467=null;Object.defineProperty(navigator,'share',{value:async()=>{throw {name:'AbortError'}},configurable:true});Object.defineProperty(navigator,'clipboard',{value:{writeText:async x=>window.copy467=x},configurable:true})");await t.click('#cmp_baseline [data-share]');
 t.equal(await t.js('window.copy467'),null,'cancelled sharing does not copy');
 t.equal(await t.count('#cmp_baseline .share_link'),0,'cancelled sharing does not show fallback');
 await t.js("Object.defineProperty(navigator,'share',{value:async()=>{throw new Error('blocked')},configurable:true});Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('blocked')}},configurable:true});document.execCommand=()=>false");await t.click('#cmp_baseline [data-share]');
 t.equal(await t.count('#cmp_baseline .share_link'),1,'blocked sharing shows selectable link');
 t.ok(await t.js("(()=>{const f=document.querySelector('#cmp_baseline .share_link'),q=new URLSearchParams(f.value.split('?')[1]);return f.readOnly&&q.get('base')==='2010-2012'&&q.get('years')==='2020-2024'&&f.value.includes('#/t/rust')})()"),'fallback preserves topic baseline and zoom');
 t.ok(await t.js("location.hash.includes('base=2010-2012')&&location.hash.includes('years=2020-2024')"),'failure keeps state');
 t.ok(await t.js("document.getElementById('base_from').value==='2010'&&document.getElementById('base_to').value==='2012'"),'failure keeps controls');
 t.ok(await t.js('document.documentElement.scrollWidth<=innerWidth+1'),'fallback fits phone');
};
