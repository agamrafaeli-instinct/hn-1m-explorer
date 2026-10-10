'use strict';
// Card rules with a plain-language message for each failure: which card, which rule, how to fix it.
const fs = require('fs'), path = require('path');
const FIX = {
  parse: ['The file must be valid JSON.', 'Check commas and quotes. Paste the file into any JSON checker to find the line.'],
  schema: ['"schema" must be 1.', 'Add "schema": 1 at the top of the card.'],
  missing: ['A card needs id, title, hypothesis and expect.', 'Fill in the missing field. Copy the wording style from hypotheses/h001-weekday-rhythm.json.'],
  prefix: ['The file name must start with the card id and a dash.', 'Rename the file to <id>-<short-name>.json, for example h200-my-guess.json, or change "id" to match.'],
  markup: ['Cards are plain text. Angle brackets that look like HTML are not allowed.', 'Remove the < > tags. Use plain words.'],
  duplicate: ['Each card id can be used once.', 'Use the next free number. List the folder to see which are taken.'],
  check: ['A card needs a "check" block with a data source.', 'Copy the "check" block from a similar card and change the field.'],
  source: ['"check.source" must be a JSON file inside data/, for example data/summary.json.', 'Use a path like data/summary.json. No folders above data/ and no web links.'],
  nosource: ['The data file named in "check.source" does not exist.', 'Check the spelling of the file name, or pick a file that is in data/.'],
  verdicts: ['A card needs a list of "verdicts".', 'Copy the "verdicts" list from a similar card and change the thresholds.'],
  refute: ['A card must say in advance what would prove it wrong: one rule with "verdict": "refuted".', 'Add a rule such as {"when":{"op":"<=","value":0.9},"verdict":"refuted","confidence":"strong"}.'],
  else: ['The last verdict rule must be the fallback: {"else": true, ...}.', 'Add a last rule with "else": true and "verdict": "inconclusive".'],
  eval: ['The card could not be computed from the data.', 'Check that "check.path" and "check.field" exist in the data file. Open the file and look for the names.']
};
class CardError extends Error { constructor(kind, detail) { super(kind); this.kind = kind; this.detail = detail || ''; } }
function validate(c, name, ids, load, evaluate) {
  const need = (ok, kind, d) => { if (!ok) throw new CardError(kind, d); };
  need(c && c.schema === 1, 'schema');
  for (const k of ['id', 'title', 'hypothesis', 'expect']) need(c[k], 'missing', 'missing field: ' + k);
  need(name.startsWith(c.id + '-'), 'prefix', 'file ' + name + ', id ' + c.id);
  need(!/<[a-zA-Z/!]/.test(JSON.stringify(c)), 'markup');
  need(!ids.has(c.id), 'duplicate', 'id ' + c.id); ids.add(c.id);
  need(c.check && typeof c.check === 'object', 'check');
  need(/^data\/[\w.-]+\.json$/.test(c.check.source || ''), 'source', 'got ' + c.check.source);
  need(Array.isArray(c.verdicts) && c.verdicts.length, 'verdicts');
  need(c.verdicts.some(v => v.verdict === 'refuted'), 'refute');
  need(c.verdicts[c.verdicts.length - 1].else, 'else');
  let data; try { data = load(c.check.source); } catch (e) { throw new CardError('nosource', c.check.source); }
  try { return evaluate(c, data); } catch (e) { throw new CardError('eval', e.message); }
}
function explain(e, name) {
  if (!(e instanceof CardError)) return `FAIL ${name}\n  Problem: ${e.message}\n  Fix: Open an issue with this line if the card looks right.`;
  const [rule, fix] = FIX[e.kind];
  return `FAIL ${name}\n  Rule: ${rule}${e.detail ? ' (' + e.detail + ')' : ''}\n  Fix: ${fix}`;
}
module.exports = { validate, explain, CardError, FIX };
