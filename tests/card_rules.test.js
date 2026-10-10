'use strict';
// One example per failure kind: the message must name the rule and give a fix.
const assert = require('assert'), R = require('./card_rules.js');
const good = () => ({ schema: 1, id: 'h200', title: 't', hypothesis: 'h', expect: 'e', check: { source: 'data/summary.json' }, verdicts: [{ when: { op: '<=', value: 1 }, verdict: 'refuted' }, { else: true, verdict: 'inconclusive' }] });
const run = (mut, name = 'h200-x', ids = new Set(), load = () => ({}), ev = () => ({ value: 1 })) => { const c = good(); mut(c); try { R.validate(c, name, ids, load, ev); } catch (e) { return e; } return null; };
const cases = [
  ['schema', c => { c.schema = 2; }], ['missing', c => { delete c.title; }], ['prefix', c => { c.id = 'h201'; }],
  ['markup', c => { c.title = '<b>x</b>'; }], ['duplicate', (c) => { }, 'h200-x', new Set(['h200'])],
  ['check', c => { delete c.check; }], ['source', c => { c.check.source = '../x.json'; }], ['verdicts', c => { delete c.verdicts; }],
  ['refute', c => { c.verdicts = [{ else: true, verdict: 'inconclusive' }]; }], ['else', c => { c.verdicts.pop(); }],
  ['nosource', c => { }, 'h200-x', new Set(), () => { throw new Error('x'); }], ['eval', c => { }, 'h200-x', new Set(), () => ({}), () => { throw new Error('no field'); }]
];
for (const [kind, mut, name, ids, load, ev] of cases) {
  const e = run(mut, name, ids, load, ev);
  assert(e && e.kind === kind, 'expected ' + kind + ' got ' + (e && e.kind));
  const t = R.explain(e, 'h200-x.json');
  assert(/Rule: /.test(t) && /Fix: /.test(t) && t.includes('h200-x.json'), 'message for ' + kind);
}
assert.strictEqual(run(() => { }), null);
console.log('ok', cases.length, 'failure kinds explained');
// The worked example in CONTRIBUTING.md must pass the real rules and compute.
const fs = require('fs'), path = require('path'), E = require('../hyp-eval.js');
const root = path.join(__dirname, '..'), ex = JSON.parse(fs.readFileSync(path.join(root, 'docs/examples/h200-example.json')));
const r = R.validate(ex, 'h200-example', new Set(), s => JSON.parse(fs.readFileSync(path.join(root, s))), E.evaluate);
assert(r.verdict, 'example card computes a verdict'); console.log('ok example card:', r.verdict, r.confidence);
