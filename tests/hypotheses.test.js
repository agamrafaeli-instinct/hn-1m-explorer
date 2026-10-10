'use strict';
// Validates every hypothesis card and runs it against its data file. Each failure prints the card, the rule and the fix.
const fs = require('fs'), path = require('path'), E = require('../hyp-eval.js'), R = require('./card_rules.js');
const root = path.join(__dirname, '..');
const names = fs.readdirSync(path.join(root, 'hypotheses')).filter(f => /^h\d{3}-[a-z0-9-]+\.json$/.test(f)).map(f => f.slice(0, -5)).sort();
const ids = new Set(); let bad = 0;
const load = src => JSON.parse(fs.readFileSync(path.join(root, src)));
for (const n of names) {
  try {
    let c; try { c = JSON.parse(fs.readFileSync(path.join(root, 'hypotheses', n + '.json'))); } catch (e) { throw new R.CardError('parse', e.message); }
    const r = R.validate(c, n, ids, load, E.evaluate);
    console.log('ok', c.id, r.value.toFixed(3), r.verdict, r.confidence);
  } catch (e) { bad++; console.log(R.explain(e, n + '.json')); }
}
process.exit(bad ? 1 : 0);
