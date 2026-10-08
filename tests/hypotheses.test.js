'use strict';
// Validates every hypothesis card and runs it against data/summary.json.
const fs = require('fs'), path = require('path'), E = require('../hyp-eval.js');
const root = path.join(__dirname, '..'), sum = JSON.parse(fs.readFileSync(path.join(root, 'data/summary.json')));
const names = fs.readdirSync(path.join(root, 'hypotheses')).filter(f => /^h\d{3}-[a-z0-9-]+\.json$/.test(f)).map(f => f.slice(0, -5)).sort();
const ids = new Set(); let bad = 0;
for (const n of names) {
  try {
    const c = JSON.parse(fs.readFileSync(path.join(root, 'hypotheses', n + '.json')));
    if (c.schema !== 1) throw new Error('schema must be 1');
    for (const k of ['id', 'title', 'hypothesis', 'expect']) if (!c[k]) throw new Error('missing ' + k);
    if (!n.startsWith(c.id + '-')) throw new Error('id must match file name prefix');
    if (/<[a-zA-Z/!]/.test(JSON.stringify(c))) throw new Error('no markup allowed');
    if (ids.has(c.id)) throw new Error('duplicate id'); ids.add(c.id);
    if (!/^data\/[\w.-]+\.json$/.test(c.check.source)) throw new Error('bad source');
    if (!c.verdicts.some(v => v.verdict === 'refuted')) throw new Error('card has no refuting rule');
    if (!c.verdicts[c.verdicts.length - 1].else) throw new Error('last rule must be else');
    const r = E.evaluate(c, sum);
    console.log('ok', c.id, r.value.toFixed(3), r.verdict, r.confidence);
  } catch (e) { bad++; console.log('FAIL', n, e.message); }
}
process.exit(bad ? 1 : 0);
