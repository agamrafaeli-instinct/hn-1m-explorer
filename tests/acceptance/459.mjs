export default async (t) => {
  await t.open('#/t/rust');
  t.equal(await t.count('#cmp_csv'), 1, 'topic has download');
  t.ok(await t.js("(()=>{const r=document.getElementById('cmp_csv').getBoundingClientRect();return r.height>=44&&r.width>=44})()"), 'download phone tap target');
  await t.js("window.csv459=null;URL.createObjectURL=b=>{window.blob459=b;return 'blob:mock'};URL.revokeObjectURL=()=>{};HTMLAnchorElement.prototype.click=function(){};document.getElementById('cmp_csv').click()");
  for(let i=0;i<60;i++){if(await t.js('!!window.blob459'))break;await t.wait(200);}
  t.ok(await t.js("window.blob459.text().then(x=>x.startsWith('topic_id,month,matched_titles,all_story_titles,share')&&x.includes('rust,'))"), 'download contains evidence rows');
  t.ok((await t.text('.cmp_evidence')).includes('ignoring case'), 'note explains dictionary scope');
  t.ok((await t.text('.cmp_evidence')).includes('film_shares.json'), 'note names source');
  t.ok(await t.js("(()=>{const c=document.querySelector('.cmp_box svg').getBoundingClientRect(),b=document.getElementById('cmp_csv').getBoundingClientRect();return c.bottom<=b.top})()"), 'chart does not overlap download');
  t.ok(await t.js('document.documentElement.scrollWidth<=innerWidth+1'), 'no sideways scroll');
  t.ok(await t.js("document.getElementById('cmp').getBoundingClientRect().bottom<=document.getElementById('cmp_find').getBoundingClientRect().top"), 'evidence clears footer');
  await t.open('#/compare');t.equal(await t.count('#cmp_csv'),0,'download is topic-specific');
};
