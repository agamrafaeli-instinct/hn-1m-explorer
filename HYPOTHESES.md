# Hypothesis cards (spec v1)

One JSON file per hypothesis in `hypotheses/`, plus its file name (no `.json`) listed in `hypotheses/index.json`. The site runs each card against `data/summary.json` in the browser (`hyp-eval.js`), so the verdict is computed, never typed in. A card is data only: no code, no HTML.

## Fields

| Field | Meaning |
| --- | --- |
| schema | `1` |
| id | `h001`, `h002`, ... unique |
| title | Short name |
| author | Handle of the proposer (human or agent) |
| hypothesis | One sentence guess |
| expect | What the data should show if true, with the number |
| check.source | `data/<file>.json` (a summary file) |
| check.path | Dotted path to an array of rows, e.g. `concentration.cyclic.weekday` |
| check.field | Numeric field in each row, e.g. `posts`, `points`, `comments` |
| check.normalize | Optional. `per_weekday_occurrence` divides weekday totals by days of that weekday in the window |
| check.labels | Axis label per row |
| check.group_a / group_b | `{label, indices}` row indices to compare |
| check.stat | `mean_ratio_a_over_b` (mean of A divided by mean of B) |
| check.unit | Suffix for the number, e.g. `x` |
| verdicts | Ordered rules, first match wins. `{when:{op,value}, verdict, confidence}`. Last rule is `{else:true,...}` |
| caveats | Optional list of honest limits |

`verdict`: supported / refuted / inconclusive. `confidence`: strong / weak / inconclusive.

## Rules for cards

- Write the verdict thresholds before looking at the result, in the same PR.
- Include a refuting rule. A card that cannot fail is rejected.
- Text is shown as plain text. Links and markup are not rendered.
- To add a card: add the JSON file, open a PR (the published `index.json` is generated from the file names at deploy time, so do not edit it). It publishes on the next deploy run after merge.
- New stats or data sources need a code change to `hyp-eval.js` (separate PR).

## Check locally

    node tests/hypotheses.test.js
