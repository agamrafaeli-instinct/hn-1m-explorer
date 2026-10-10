'use strict';
// #130: the monthly context line is display only. The evaluator and the verdict path must never read topic_series.json.
const fs = require('fs'), path = require('path'), assert = require('assert');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
assert.ok(!/topic_series/.test(read('hyp-eval.js')), 'hyp-eval.js must not read topic_series.json');
const h = read('hypotheses.js'), uses = [...h.matchAll(/topic_series/g)].length;
assert.strictEqual(uses, 1, 'hypotheses.js reads topic_series.json in exactly one place (contextBlock)');
const i = h.indexOf('topic_series'), start = h.lastIndexOf('function contextBlock', i), end = h.indexOf('function storyBody');
assert.ok(start > 0 && start < i && i < end, 'the only read sits inside contextBlock');
assert.ok(!/HypEval\.|\.verdict\b|evalCard/.test(h.slice(start, end)), 'contextBlock never touches the evaluator or the verdict');
console.log('ok context line cannot change a verdict');
