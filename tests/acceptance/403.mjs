// #403 Explorer: share of loaded points held by the matches.
export default async (t) => {
  await t.open('#/explore?q=a');
  await t.wait(8000);
  const r = await t.js("(()=>{const e=document.getElementById('ptshare');let all=0;for(let i=0;i<D.n;i++)all+=D.score[i];return JSON.stringify({hid:e.hidden,txt:e.textContent,all,n:D.n})})()");
  const o = JSON.parse(r);
  t.ok(!o.hid && /^These hold [\d,]+ points, [\d.]+% of the [\d,]+ points in the [\d,]+ posts loaded\.$/.test(o.txt), 'line shows points and a percent');
  t.ok(o.txt.includes(o.all.toLocaleString('en-US')) && o.txt.includes(o.n.toLocaleString('en-US')), 'the totals are the loaded totals');
  await t.open('#/explore?q=zzzqqxx');
  await t.wait(3000);
  t.ok(await t.js("document.getElementById('ptshare').hidden"), 'hidden when nothing matches');
};
