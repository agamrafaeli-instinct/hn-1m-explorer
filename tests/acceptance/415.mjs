// #415 Explorer: first and last date of the matches, from loaded posts.
export default async (t) => {
  await t.open('#/explore?q=a');
  await t.wait(8000);
  const o = JSON.parse(await t.js("(()=>{let lo=1e15,hi=0;const m=document.getElementById('count').textContent;const e=document.getElementById('daterange');return JSON.stringify({hid:e.hidden,txt:e.textContent,m})})()"));
  t.ok(!o.hid && /^Matches run from \d{4}-\d{2}-\d{2} to \d{4}-\d{2}-\d{2}, among the posts loaded\.$/.test(o.txt), 'line shows first and last date');
  t.ok(await t.js("(()=>{const ms=[...document.querySelectorAll('#list li .m')].map(e=>(e.textContent.match(/\\d{4}-\\d{2}-\\d{2}/)||[''])[0]).filter(Boolean);const e=document.getElementById('daterange').textContent.match(/\\d{4}-\\d{2}-\\d{2}/g);return ms.length>0&&ms.every(d=>d>=e[0]&&d<=e[1])})()"), 'listed posts fall inside the range');
  const ok = await t.js("(()=>{const rows=[...document.querySelectorAll('#list li')].length;return rows>0})()");
  t.ok(ok, 'there are matches listed');
  await t.js("(()=>{const q=document.getElementById('from');q.value='2999-01-01';q.dispatchEvent(new Event('input'));return 1})()");
  await t.wait(900);
  t.ok(await t.js("document.getElementById('daterange').hidden"), 'hidden when nothing matches');
};
