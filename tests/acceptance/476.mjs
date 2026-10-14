export default async(t)=>{
 for(const id of ['sg2','sg3','sg4','sg5']){
  await t.open('#/saga?beat='+id);await t.wait(900);
  t.ok(await t.js(`document.body.dataset.view==='saga'&&Math.abs(document.getElementById('${id}').getBoundingClientRect().top)<80`),'direct beat opens '+id);
  await t.js("Object.defineProperty(navigator,'share',{value:async x=>window.share476=x,configurable:true})");await t.click('#'+id+' [data-share=beat]');await t.wait(150);
  t.ok(await t.js(`window.share476.url.includes('share/p/home-${id}.html')`),'share keeps beat '+id);
 }
 await t.js("window.copy476=null;Object.defineProperty(navigator,'clipboard',{value:{writeText:async u=>window.copy476=u},configurable:true});Object.defineProperty(navigator,'share',{value:async()=>{throw new DOMException('cancel','AbortError')},configurable:true})");
 await t.click('#sg5 [data-share=beat]');await t.wait(100);t.ok(await t.js('window.copy476===null'),'cancel does not copy');
 await t.js("Object.defineProperty(navigator,'share',{value:async()=>{throw new Error('failed')},configurable:true})");
 await t.click('#sg5 [data-share=beat]');await t.wait(100);t.ok(await t.js("window.copy476.includes('share/p/home-sg5.html')"),'failed share copies beat');
 await t.js("Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('blocked')}},configurable:true});document.execCommand=()=>false");
 await t.click('#sg5 [data-share=beat]');await t.wait(100);t.ok(await t.js("document.querySelector('#sg5 input.share_link').value.includes('share/p/home-sg5.html')"),'blocked copy shows beat link');
 t.ok(await t.js("[...document.querySelectorAll('[data-share=beat]')].every(b=>b.getBoundingClientRect().height>=44&&b.getBoundingClientRect().width>=44)"),'beat share targets');
 t.ok(await t.js('document.documentElement.scrollWidth<=innerWidth+1'),'phone beat fits');
};
