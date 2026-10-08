'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert'), E = require('../hyp-eval.js');
const root = path.join(__dirname, '..'), plan = JSON.parse(fs.readFileSync(path.join(root, 'docs/curious-round2-plan.json')));
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/curious_round2.json')));
for (const test of plan.tests) {
 const name = fs.readdirSync(path.join(root,'hypotheses')).find(n => n.startsWith(test.id+'-'));
 const card = JSON.parse(fs.readFileSync(path.join(root,'hypotheses',name)));
 assert.equal(card.verdicts[0].when.value,test.support); assert.equal(card.verdicts[1].when.value,test.refute);
 const r = E.evaluate(card,data); assert(Number.isFinite(r.value)); assert(r.series.every(Number.isFinite));
 assert.equal(r.series.length,test.metric === 'weekend' ? 7 : 10);
 // Do not accept the evaluator's zero-denominator fallback for any measured row.
 const rows = card.check.path.split('.').reduce((a,k)=>a[k],data);
 for (const group of [card.check.group_a,card.check.group_b]) for (const row of rows) assert(row[group.per] > 0);
 const synthetic = JSON.parse(JSON.stringify(card)); synthetic.check = { ...card.check, path:'rows', group_a:{label:'A',field:'a',indices:[0]},group_b:{label:'B',field:'b',indices:[0]} };
 assert.equal(E.evaluate(synthetic,{rows:[{a:test.support,b:1}]}).verdict,'supported');
 assert.equal(E.evaluate(synthetic,{rows:[{a:test.refute,b:1}]}).verdict,'refuted');
 assert.equal(E.evaluate(synthetic,{rows:[{a:(test.support+test.refute)/2,b:1}]}).verdict,'inconclusive');
 console.log('ok',test.id,r.value.toFixed(4),r.verdict,'matched',data.totals[test.key].stories);
}
assert.equal(plan.tests.length,15);
