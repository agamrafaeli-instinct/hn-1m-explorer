export default async(t)=>{
 await t.open('#/t/rust');await t.wait(1000);
 const ids=await t.js("fetch('data/topic_series.json').then(r=>r.json()).then(d=>d.topics.map(x=>x.id))");
 for(const id of ids){
  await t.js('location.hash='+JSON.stringify('#/t/'+id));
  for(let i=0;i<30;i++){if(await t.js("!!document.querySelector('.baseline_ratio')&&document.querySelector('#cmp .cmp_t').textContent!==''"))break;await t.wait(100);}
  const ok=await t.js(`Promise.all([fetch('data/topic_series.json').then(r=>r.json()),fetch('data/film_shares.json').then(r=>r.json())]).then(([d,f])=>{const x=TopicBaseline.compare(f,d,${JSON.stringify(id)}),p=[...document.querySelectorAll('.baseline_period')];return p.length===2&&p[0].textContent.includes(x.latest.n.toLocaleString('en-US')+' matching titles / '+x.latest.total.toLocaleString('en-US'))&&p[1].textContent.includes(x.baseline.n.toLocaleString('en-US')+' matching titles / '+x.baseline.total.toLocaleString('en-US'))})`);
  t.ok(ok,'source default counts '+id);
 }
 await t.js("location.hash='#/t/rust?base=2010-2012'");await t.wait(500);
 const fixed=await t.text('.baseline_period');
 await t.js("location.hash='#/t/rust?base=2013-2015'");await t.wait(500);
 t.equal(await t.text('.baseline_period'),fixed,'latest months and counts fixed across ranges');
 await t.open('#/t/not-a-source-topic');t.equal(await t.count('.baseline_period'),0,'missing topic has no invented period');
};
