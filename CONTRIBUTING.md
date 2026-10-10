# Submit a hypothesis

Guess something about HN, say in advance what the data must show, and let the site check it. This page takes you from a blank file to a green check.

## Steps

1. Fork the repo and clone it.
2. Pick the next free number. List `hypotheses/` and take the number after the highest one.
3. Create `hypotheses/hNNN-your-name.json`. Start from the worked example below. The `id` must match the file name prefix.
4. Say what you expect and set the thresholds before you look at the result. Include a rule that refutes you.
5. Run `node tests/hypotheses.test.js`. A passing card prints a line like `ok h200 0.927 inconclusive inconclusive`: the card id, the measured value, the verdict and the confidence.
6. Open a PR with only that file. The PR template has the checklist.

Fields are explained in `HYPOTHESES.md`.

## Worked example

This is a complete card. It is in the repo as [docs/examples/h200-example.json](docs/examples/h200-example.json), and a test checks that it passes. Copy it to `hypotheses/h200-example.json` to try it. It prints `ok h200 0.927 inconclusive inconclusive`: it is a real answer, and the data does not support the guess.

```json
{
  "schema": 1,
  "id": "h200",
  "title": "Deep tech words are rising in titles",
  "author": "your-name",
  "audience": "engineers",
  "hypothesis": "Deep tech words (quantum, fusion, chips and others on the site's list) are appearing in more story titles than ten weeks ago.",
  "expect": "If true, their share of stories in the latest 4 full weeks should be at least 1.3x the share in the first 4 (1.1x counts as weak, 0.9x or below refutes it).",
  "check": {
    "source": "data/summary.json",
    "path": "terms.weekly",
    "label_field": "week",
    "stat": "mean_ratio_a_over_b",
    "unit": "x",
    "field": "deeptech_stories",
    "per_label": "share of stories",
    "group_a": {
      "label": "Latest 4 weeks",
      "indices": [
        -4,
        -3,
        -2,
        -1
      ],
      "per": "stories"
    },
    "group_b": {
      "label": "First 4 weeks",
      "indices": [
        0,
        1,
        2,
        3
      ],
      "per": "stories"
    },
    "display_pct": true
  },
  "verdicts": [
    {
      "when": {
        "op": ">=",
        "value": 1.3
      },
      "verdict": "supported",
      "confidence": "strong"
    },
    {
      "when": {
        "op": ">=",
        "value": 1.1
      },
      "verdict": "supported",
      "confidence": "weak"
    },
    {
      "when": {
        "op": "<=",
        "value": 0.9
      },
      "verdict": "refuted",
      "confidence": "strong"
    },
    {
      "else": true,
      "verdict": "inconclusive",
      "confidence": "inconclusive"
    }
  ]
}
```

What each part does:

- `hypothesis` is your guess in one sentence. `expect` says in numbers what must be true, before you look.
- `check` says where the number comes from: a file in `data/`, the path inside it, and how to compute it. New stats or data sources need a code change to `hyp-eval.js`, in a separate PR.
- `verdicts` are read top to bottom. The first rule that matches wins. The last rule must be `"else": true`. One rule must have `"verdict": "refuted"`, so the card says in advance what would prove you wrong.

## When the check fails

Each failure prints the card, the rule and a fix. Common ones:

| Message starts with | One-line fix |
|---|---|
| The file must be valid JSON | Check commas and quotes in the line the checker names. |
| "schema" must be 1 | Add `"schema": 1`. |
| A card needs id, title, hypothesis and expect | Fill in the missing field named in brackets. |
| The file name must start with the card id | Rename the file to `<id>-<short-name>.json`. |
| Cards are plain text | Remove angle brackets that look like HTML. |
| Each card id can be used once | Use the next free number. |
| "check.source" must be a JSON file inside data/ | Use a path like `data/summary.json`. |
| The data file does not exist | Fix the file name in `check.source`. |
| A card must say in advance what would prove it wrong | Add a rule with `"verdict": "refuted"`. |
| The last verdict rule must be the fallback | Add a last rule with `"else": true`. |
| The card could not be computed from the data | Check `check.path` and `check.field` against the data file. |

## After you open the PR

A check runs on the PR. It fails if the card is malformed, has no refuting rule, points at data that does not exist, or touches other files. A maintainer reviews, then merges.

After a merge to `main`, the card is published as a finding on the next deploy. The verdict is computed from the data, not typed by anyone. Failed hypotheses are shown too; that is the point.

Do not edit `hypotheses/index.json` (generated).

Issues and board text follow [docs/ISSUES_STYLE.md](docs/ISSUES_STYLE.md).
