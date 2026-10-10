'use strict';
// Guards the one remaining older VC card (h119; the rest were retired when their film versions passed checks) and the ID rules for new cards.
// 1. The file is byte-identical to tests/old_cards.sha256.
// 2. Card IDs are unique and match their file name prefix (checked on every file, so new cards are covered).
// 3. Adding a new card does not change the tally entry (verdict, confidence) of any old card.
// 4. Any card added after the old set passes the same checks as tests/hypotheses.test.js.
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto'), assert = require('assert'), cp = require('child_process');
const root = path.join(__dirname, '..'), hd = path.join(root, 'hypotheses');
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const listed = fs.readFileSync(path.join(__dirname, 'old_cards.sha256'), 'utf8').trim().split('\n').map(l => l.split(/\s+/));
const OLD = n => { const k = +n.slice(1, 4); return k === 119; };
assert.strictEqual(listed.length, 1, "hash list must hold 1 card");
for (const [h, f] of listed) assert.strictEqual(sha(path.join(hd, f)), h, 'old card changed: ' + f);
const files = fs.readdirSync(hd).filter(f => /^h\d{3}-[a-z0-9-]+\.json$/.test(f));
assert.strictEqual(files.filter(OLD).length, 1, 'an old card file is missing or extra');
const ids = new Set();
for (const f of files) { const id = JSON.parse(fs.readFileSync(path.join(hd, f))).id; assert(f.startsWith(id + '-'), 'id must match file name: ' + f); assert(!ids.has(id), 'duplicate id ' + id); ids.add(id); }
// Build the tally twice in a scratch site: as it is, and with one extra new card. Old entries must match.
function tally(extra) {
  const site = fs.mkdtempSync(path.join(os.tmpdir(), 'oc-')); fs.mkdirSync(path.join(site, 'hypotheses')); fs.mkdirSync(path.join(site, 'data'));
  const names = [];
  for (const f of files) { fs.copyFileSync(path.join(hd, f), path.join(site, 'hypotheses', f)); names.push(f.slice(0, -5)); }
  if (extra) { const base = JSON.parse(fs.readFileSync(path.join(hd, 'h300-typescript-vs-javascript.json'))); base.id = 'h999'; base.title = 'Test card'; fs.writeFileSync(path.join(site, 'hypotheses', 'h999-test-card.json'), JSON.stringify(base)); names.push('h999-test-card'); }
  fs.writeFileSync(path.join(site, 'hypotheses/index.json'), JSON.stringify(names.sort()));
  for (const f of fs.readdirSync(path.join(root, 'data'))) if (/^[\w.-]+\.json$/.test(f)) fs.copyFileSync(path.join(root, 'data', f), path.join(site, 'data', f));
  cp.execFileSync('node', [path.join(root, 'scripts/build_hyp_bundle.js'), site], { stdio: 'pipe' });
  const t = JSON.parse(fs.readFileSync(path.join(site, 'hypotheses/tally.json')));
  fs.rmSync(site, { recursive: true, force: true }); return t;
}
const a = tally(false), b = tally(true), pick = t => t.filter(x => OLD(x.name)).map(x => JSON.stringify(x));
assert.deepStrictEqual(pick(b), pick(a), 'old card tally entries changed when a card was added');
assert.strictEqual(b.length, a.length + 1);
// New cards (anything not in the old set) must validate with the shared test.
try { cp.execFileSync('node', [path.join(__dirname, 'hypotheses.test.js')], { stdio: 'pipe' }); } catch (e) { assert.fail('hypotheses.test.js failed:\n' + e.stdout); }
console.log('ok old cards unchanged:', listed.length, '| cards:', files.length, '| tally entries checked:', pick(a).length);
