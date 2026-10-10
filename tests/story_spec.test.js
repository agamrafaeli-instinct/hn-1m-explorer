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
for (const f of (fs.existsSync(path.join(root, 'stories')) ? fs.readdirSync(path.join(root, 'stories')) : []).filter(x => /^h\d{3}\.json$/.test(x))) {
  const s = JSON.parse(fs.readFileSync(path.join(root, 'stories', f))); const e = checkStory(s); assert.deepStrictEqual(e, [], f + ': ' + e);
}
console.log('ok story spec checks; rules labels', JSON.stringify(tally), 'for', names.length, 'cards');

// ---- pilot stories: resolve against current data (issue #128) ----
const sum0 = JSON.parse(fs.readFileSync(path.join(root, 'data/summary.json')));
const dig = (o, p) => p.split('.').reduce((x, k) => (x == null ? undefined : x[k]), o);
const nf = x => Math.round(x).toLocaleString('en-US');
function groupRows(card, data, g) {
  const rows = dig(data, card.check.path), ix = card.check['group_' + g].indices;
  return E.resolve(ix, rows.length).map(i => rows[i]);
}
function storyVars(story, card, data, r) {
  const c = card.check, v = {}, pct = !!c.display_pct;
  const fmt = x => pct ? (x * 100).toFixed(2) + '%' : (Math.abs(x) >= 10 ? x.toFixed(1) : x.toFixed(2));
  v.ratio = r.value.toFixed(2); v.a = fmt(r.mean_a); v.b = fmt(r.mean_b);
  v.label_a = c.group_a.label; v.label_b = c.group_b.label;
  const lab = g => { const rows = groupRows(card, data, g), k = c.label_field; return k ? rows[0][k] + ' to ' + rows[rows.length - 1][k] : null; };
  v.window_a = lab('a'); v.window_b = lab('b');
  const rule = x => card.verdicts.find(y => y.verdict === x);
  v.support_at = rule('supported') && rule('supported').when.value; v.refute_at = rule('refuted') && rule('refuted').when.value;
  const raw = {};
  for (const [k, d] of Object.entries(story.counts || {})) {
    const rows = groupRows(card, data, d.group); raw[k] = rows.reduce((s, x) => s + (+x[d.field] || 0), 0); v[k] = nf(raw[k]);
  }
  if (raw.n_a != null && raw.t_a) v.share_a = (raw.n_a / raw.t_a * 100).toFixed(2) + '%';
  if (raw.n_b != null && raw.t_b) v.share_b = (raw.n_b / raw.t_b * 100).toFixed(2) + '%';
  return v;
}
const fill = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => v[k]);
const cardIds = new Set(names.map(n => n.slice(0, 4)));
if (fs.existsSync(path.join(root, 'stories'))) for (const f of fs.readdirSync(path.join(root, 'stories')).filter(x => /^h\d{3}\.json$/.test(x))) {
  const s = JSON.parse(fs.readFileSync(path.join(root, 'stories', f)));
  const cf = names.find(n => n.startsWith(s.id + '-')), card = JSON.parse(fs.readFileSync(path.join(root, 'hypotheses', cf)));
  const data = card.check.source === 'data/summary.json' ? sum0 : JSON.parse(fs.readFileSync(path.join(root, card.check.source)));
  const r = E.evaluate(card, data), v = storyVars(s, card, data, r);
  assert.strictEqual(r.verdict, s.for_verdict, s.id + ' verdict now ' + r.verdict);
  const used = [...(s.opening + s.takeaway).matchAll(/\{(\w+)\}/g)].map(m => m[1]);
  for (const k of used) assert.ok(v[k] !== undefined && v[k] !== null && !/NaN|undefined/.test(String(v[k])), s.id + ' placeholder ' + k);
  for (const e of s.explore) assert.ok(cardIds.has(e), s.id + ' explore ' + e);
  assert.strictEqual(render(s, r.verdict, v).mode, 'story');
  if (process.env.SHOW_STORIES) console.log('\n' + s.id + ' ' + s.question + '\n  ' + fill(s.opening, v) + '\n  ' + fill(s.takeaway, v));
}
if (fs.existsSync(path.join(root, 'stories'))) {
  const ids = fs.readdirSync(path.join(root, 'stories')).filter(f => /^h\d{3}\.json$/.test(f)).map(f => f.slice(0, -5)).sort();
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(root, 'stories/index.json'))).ids, ids, 'stories/index.json must list every story');
}

// Every story file passes the spec check and names a card that exists (issue #131).
{
  const dir = path.join(root, 'stories'), ids = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8')).ids;
  const files = fs.readdirSync(dir).filter(f => /^h\d+\.json$/.test(f)).map(f => f.replace('.json', ''));
  assert.deepStrictEqual([...ids].sort(), files.sort(), 'stories/index.json must list every story file');
  for (const id of files) {
    const s = JSON.parse(fs.readFileSync(path.join(dir, id + '.json'), 'utf8'));
    assert.strictEqual(s.id, id);
    assert.deepStrictEqual(checkStory(s), [], id + ' fails the story check');
    assert.ok(fs.readdirSync(path.join(root, 'hypotheses')).some(f => f.startsWith(id + '-')), id + ' has no card');
  }
  console.log('ok ' + files.length + ' story files pass the spec check');
}
