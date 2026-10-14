export default async(t)=>{
 await t.open('#/');t.ok(await t.js("document.querySelector('.sg_hook h1').textContent.includes('We counted')"),'renamed site opens Home');
 t.ok(await t.js("[...document.querySelectorAll('a[href*=\"github.com/agamrafaeli-instinct/\"]')].every(a=>!a.href.includes('hn-1m-explorer/'))"),'source links use new repo');
 await t.open('#/saga?beat=sg3');await t.js("Object.defineProperty(navigator,'share',{value:async x=>window.renameShare=x,configurable:true})");await t.click('#sg3 [data-share=beat]');await t.wait(200);
 t.ok(await t.js("window.renameShare.url.includes('/share/p/home-sg3.html')"),'relative share keeps deployed base path');
};
