export default async (t) => {
  await t.open('#/t/rust'); await t.wait(1000);
  for (const path of ['button', 'cancel', 'button', 'cancel']) {
    await t.js("document.querySelector('.cmp_det').focus();document.querySelector('.cmp_det').click()");
    t.equal(await t.count('dialog[open]'), 1, 'one open dialog');
    if (path === 'button') await t.click('dialog button');
    else await t.js("(() => { const d=document.querySelector('dialog');if(d.requestClose)d.requestClose();else{const ev=new Event('cancel',{cancelable:true});if(d.dispatchEvent(ev))d.close();} })()");
    await t.wait(300);
    t.equal(await t.count('dialog'), 0, path + ': removes closed dialog');
    t.ok(await t.js("document.activeElement===document.querySelector('.cmp_det')"), path + ': focus restored');
  }
};
