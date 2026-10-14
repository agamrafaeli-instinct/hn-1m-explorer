'use strict';
const assert = require('node:assert/strict'), fs = require('fs'), B = require('../topic-baseline.js');
const topic = { topics: [{id:'x',matcher:'x'}], windows:{latest:['2025-01','2025-12']} };
const film = {terms:{x:{pattern:'x'}},monthly:[{month:'2023-01',total:10,x_s:5},{month:'2024-01',total:100,x_s:10},{month:'2025-01',total:100,x_s:25}]};
let r=B.compare(film,topic,'x');assert.equal(r.baseline.share,15/110);assert.equal(r.ratio,(25/100)/(15/110));assert.deepEqual(r.eligibleYears,[2023,2024]);
assert.equal(B.compare(film,topic,'x',{from:2023,to:2023}).baseline.share,.5);
assert.equal(B.compare(film,topic,'x',{from:2000,to:2001}).baseline.share,null);
assert.throws(()=>B.compare(film,topic,'x',{from:2024,to:2023}),/Invalid baseline/);
assert.throws(()=>B.compare(film,topic,'x',{from:2024,to:2025}),/overlaps/);
const changed=()=>JSON.parse(JSON.stringify(film));let f=changed();f.monthly[0].total=0;f.monthly[0].x_s=0;assert.equal(B.compare(f,topic,'x',{from:2023,to:2023}).baseline.share,null);
f=changed();f.monthly[0].x_s=0;f.monthly[1].x_s=0;assert.equal(B.compare(f,topic,'x').ratio,null);
f=changed();delete f.monthly[0].x_s;assert.throws(()=>B.compare(f,topic,'x'),/source counts/);
f=changed();f.terms.x.pattern='other';assert.throws(()=>B.compare(f,topic,'x'),/disagree/);
f=changed();f.monthly.push(f.monthly[0]);assert.throws(()=>B.compare(f,topic,'x'),/duplicate/);
assert.throws(()=>B.compare(film,topic,'missing'),/Unknown topic/);
const liveFilm=JSON.parse(fs.readFileSync('data/film_shares.json')), liveTopics=JSON.parse(fs.readFileSync('data/topic_series.json'));
for(const t of liveTopics.topics){const got=B.compare(liveFilm,liveTopics,t.id);for(const [a,b] of [[got.latest,t.latest],[got.baseline,t.prior]]){assert.equal(a.n,b.n,t.id+' matches');assert.equal(a.total,b.total,t.id+' totals');assert.ok(Math.abs(a.share-b.share)<1e-12,t.id+' shares');}assert.ok(got.eligibleYears.every(y=>y<+liveTopics.windows.latest[0].slice(0,4)));}
console.log('ok topic baselines: pooled counts, error states and all-topic source agreement');
