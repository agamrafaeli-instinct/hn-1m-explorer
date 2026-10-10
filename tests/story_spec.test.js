'use strict';
// Reference checks for docs/THROUGHLINE_SPEC.md (issue #127). Real renderer: issue #129.
const fs = require('fs'), path = require('path'), assert = require('assert'), E = require('../hyp-eval.js');
const root = path.join(__dirname, '..');
const ALLOWED = new Set(['ratio', 'a', 'b', 'label_a', 'label_b', 'window_a', 'window_b', 'support_at', 'refute_at', 'share_a', 'share_b']);
const BANNED = /preregist|pre-regist|\bcaus(e|es|ed)\b|\bbecause\b|adoption|\bdemand\b|sentiment|statistical(ly)? (confidence|significan)|confirmed/i;

function checkStory(s) {
  const err = [];
  for (const k of ['schema', 'id', 'for_verdict', 'question', 'why', 'opening', 'takeaway', 'boundary', 'explore']) if (s[k] === undefined) err.push('missing ' + k);
  if (s.question && !/\?$/.test(s.question)) err.push('question must end with ?');
  const counts = Object.keys(s.counts || {});
  for (const k of ['opening', 'takeaway']) {
    const t = s[k] || '';
    for (const m of t.matchAll(/\{(\w+)\}/g)) if (!ALLOWED.has(m[1]) && !counts.includes(m[1])) err.push('unknown placeholder ' + m[1]);
    if (/\d/.test(t.replace(/\{\w+\}/g, ''))) err.push('typed number in ' + k);
  }
  if (BANNED.test([s.question, s.why, s.opening, s.takeaway, s.boundary].join(' '))) err.push('banned word');
  return err;
}
function rulesLabel(c) {
  const txt = JSON.stringify([c.caveats, c.expect, c.rules]);
  if (/exploratory|set after|after (seeing|earlier)|saved after/i.test(txt)) return 'exploratory';
  if (/set before|in advance|before the test/i.test(txt)) return 'before';
  return 'declared';
}
function render(story, verdict, vars) {
  if (!story) return { mode: 'card', line: false };
  if (story.for_verdict !== verdict) return { mode: 'card', line: true };
  const names = [...(story.opening + story.takeaway).matchAll(/\{(\w+)\}/g)].map(m => m[1]);
  if (names.some(n => vars[n] === undefined || vars[n] === null || Number.isNaN(vars[n]))) return { mode: 'card', line: true };
  return { mode: 'story', line: false };
}

const good = { schema: 1, id: 'h016', for_verdict: 'refuted', question: 'Is React losing ground?', why: 'x', opening: '{n_a} of {t_a} in {label_a}.', takeaway: 'Share rose {ratio}x.', boundary: 'Matches words.', explore: [], counts: { n_a: {}, t_a: {} } };
assert.deepStrictEqual(checkStory(good), []);
assert.ok(checkStory({ ...good, opening: 'In 2023 it was {a}.' }).some(e => /typed number/.test(e)));
assert.ok(checkStory({ ...good, takeaway: '{nope} x' }).some(e => /unknown placeholder/.test(e)));
assert.ok(checkStory({ ...good, why: 'This shows adoption.' }).some(e => /banned/.test(e)));
const vars = { n_a: 1, t_a: 2, label_a: 'x', ratio: 1.3 };
assert.deepStrictEqual(render(good, 'refuted', vars), { mode: 'story', line: false });
assert.deepStrictEqual(render(good, 'supported', vars), { mode: 'card', line: true });
assert.deepStrictEqual(render(good, 'refuted', { ...vars, ratio: null }), { mode: 'card', line: true });
assert.deepStrictEqual(render(null, 'refuted', vars), { mode: 'card', line: false });

const names = fs.readdirSync(path.join(root, 'hypotheses')).filter(f => /^h\d{3}-.*\.json$/.test(f));
const tally = { exploratory: 0, before: 0, declared: 0 };
for (const n of names) tally[rulesLabel(JSON.parse(fs.readFileSync(path.join(root, 'hypotheses', n))))]++;
assert.strictEqual(tally.exploratory + tally.before + tally.declared, names.length);
for (const f of fs.existsSync(path.join(root, 'stories')) ? fs.readdirSync(path.join(root, 'stories')) : []) {
  const s = JSON.parse(fs.readFileSync(path.join(root, 'stories', f))); const e = checkStory(s); assert.deepStrictEqual(e, [], f + ': ' + e);
}
console.log('ok story spec checks; rules labels', JSON.stringify(tally), 'for', names.length, 'cards');
