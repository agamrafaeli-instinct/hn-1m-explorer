'use strict';
// Staging step: one bundle of all cards plus a small tally, so phones fetch 1-2 files instead of 80+.
// usage: node scripts/build_hyp_bundle.js <staged site dir>
const fs = require('fs'), path = require('path'), E = require('../hyp-eval.js');
const site = path.resolve(process.argv[2]), hd = path.join(site, 'hypotheses');
const hiddenFile = path.join(__dirname, '../docs/hidden_cards.json'), hidden = new Set(fs.existsSync(hiddenFile) ? JSON.parse(fs.readFileSync(hiddenFile)).hidden : []);
const names = JSON.parse(fs.readFileSync(path.join(hd, 'index.json'))).filter(n => !hidden.has(n.split('-')[0]));
const cache = {}, cards = [], tally = [];
for (const n of names) {
  try {
    const card = JSON.parse(fs.readFileSync(path.join(hd, n + '.json'))), src = card.check.source;
    if (!/^data\/[\w.-]+\.json$/.test(src)) throw new Error('source must be data/*.json');
    const sum = cache[src] || (cache[src] = JSON.parse(fs.readFileSync(path.join(site, src)))), r = E.evaluate(card, sum);
    cards.push({ name: n, card });
    tally.push({ name: n, audience: card.audience || null, title: card.title, verdict: r.verdict, confidence: r.confidence });
  } catch (e) { cards.push({ name: n, error: e.message }); tally.push({ name: n, error: e.message }); }
}
fs.writeFileSync(path.join(hd, 'bundle.json'), JSON.stringify({ cards }));
fs.writeFileSync(path.join(hd, 'tally.json'), JSON.stringify(tally));
console.log('bundle', cards.length, 'cards');
