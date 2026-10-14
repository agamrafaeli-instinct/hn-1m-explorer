export default async(t)=>{
 await t.open('#/saga?beat=sg3');t.ok(await t.js("typeof SharePage==='function'&&!document.querySelector('#sg3 [data-share=beat]').disabled"),'sharing ready before tap');
 t.ok(await t.js("window.called482=false;Object.defineProperty(navigator,'share',{value:async()=>{window.called482=true},configurable:true});document.querySelector('#sg3 [data-share=beat]').click();window.called482"),'first tap invokes share synchronously');
};
