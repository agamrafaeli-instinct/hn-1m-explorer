export default async (t) => {
  await t.open('#/explore');
  t.equal(await t.js("document.getElementById('loadn').value"), await t.js("document.getElementById('loadn').options[0].value"), 'manual default is smallest slice');
  t.ok(await t.js("!!document.querySelector('#loadn option[data-more]')"), 'Search more recommendation exists separately');
  t.ok(await t.js("+document.querySelector('#loadn option[data-more]').value>=+document.getElementById('loadn').value"), 'recommendation at least smallest');
  await t.click('#loadbtn');
  for(let i=0;i<120;i++){if(await t.js('!busy && loadedSize>0'))break;await t.wait(250);}
  t.equal(await t.js('String(loadedSize)'), await t.js("document.getElementById('loadn').options[0].value"), 'manual Load uses smallest slice');
  t.ok(await t.js("document.getElementById('moreslice').hidden === (loadedSize>=+document.querySelector('#loadn option[data-more]').value)"), 'Search more visibility matches recommendation');
};
