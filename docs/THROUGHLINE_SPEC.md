# Throughline story format

Spec for issue #127, epic #125. Decisions in force: a question headline with the original claim kept as a "Tested proposition" line; story copy lives in the top-level `stories/` folder (to be allowlisted in `scripts/stage_site.py` when the first file lands). Cards h012 to h030 and h115 to h119 are never edited. A story sits beside the card, not inside it.

## File: `stories/<card id>.json`

```json
{
  "schema": 1,
  "id": "h016",
  "for_verdict": "refuted",
  "question": "Is React losing ground on HN?",
  "why": "React is the default front-end name. A fall would mean attention moved on.",
  "opening": "React appeared in {share_a} of stories in {label_a} ({n_a} of {t_a}) and {share_b} in {label_b} ({n_b} of {t_b}).",
  "takeaway": "No. React's share rose {ratio}x. The card needed {support_at}x or lower to support the idea.",
  "boundary": "\"React\" also matches the verb. A story that names React is not proof anyone uses it.",
  "explore": ["h012", "h030"],
  "counts": {
    "n_a": {"field": "react_s", "group": "a", "op": "sum"},
    "t_a": {"field": "s_total", "group": "a", "op": "sum"},
    "n_b": {"field": "react_s", "group": "b", "op": "sum"},
    "t_b": {"field": "s_total", "group": "b", "op": "sum"}
  }
}
```

Required: `schema` (1), `id`, `for_verdict`, `question` (ends with "?"), `why`, `opening`, `takeaway`, `boundary`, `explore` (list of card ids that exist, may be empty). `counts` is required when the text uses a count placeholder.

## Placeholders

A placeholder is `{name}`. The only names allowed:

| Name | Comes from |
|---|---|
| `{ratio}` | evaluator `value`, shown to 2 decimals |
| `{a}`, `{b}` | evaluator `mean_a`, `mean_b`, shown to 1 or 2 significant decimals as the card unit says |
| `{label_a}`, `{label_b}` | the card's `group_a.label`, `group_b.label` |
| `{window_a}`, `{window_b}` | first and last label of each group in the data file, such as "Jan 2023 to Jun 2023" |
| `{support_at}`, `{refute_at}` | the `value` of the card's first supported rule and its refuted rule |
| names declared in `counts` | a sum or mean of one named field of the card's data file, for group `a` or `b` |
| `{share_a}`, `{share_b}` | `n_x / t_x` as a percent, only when both counts are declared |

No other names. No typed numbers: every digit in `opening` and `takeaway` must come from a placeholder. A date or window written as digits fails the check.

## Fallback

The page shows the story only when all of these hold. Otherwise it shows the current card text, and adds the line "This story needs review after the latest refresh." only for the first two cases.

1. The computed verdict equals `for_verdict` (verdict change, line shown).
2. Every placeholder resolves to a finite number or a non-empty label (missing field, line shown).
3. A story file exists for the card (missing story, no line, silent fallback).

## Rules label (all cards)

One line per card, chosen by this order:

1. The card has a `rules` field or caveat text that says thresholds were saved after earlier data was seen: "Thresholds saved after earlier summaries were seen (exploratory)". This is the 30 flagged cards in docs/THROUGHLINE_AUDIT.md (flag `explore`).
2. The card states that thresholds were set before the test: "Thresholds set before the test".
3. Any other card: "Thresholds as declared on the card".

The label never says preregistered, confirmed or significant.

## Coverage line (all cards)

Built from the data file, never typed:
- Window: the first and last label used by the card ("Tested: Jul 27 to Oct 4 2026").
- Source: the file name and its last update date from `data/manifest.json` when present.
- The words "full archive" are removed. History cards say "Context: Jan 2023 to Jun 2026, monthly keyword counts, not the full HN archive", with the dates read from the file.
- Historical context is a second chart under the takeaway and never changes the verdict.

## Banned wording

No claim of preregistration, cause, motive, adoption, demand, use, sentiment or statistical confidence. Confidence labels stay "declared thresholds". Check by the word list in `tests/story_spec.test.js`.

## Tests

`tests/story_spec.test.js` holds a reference of the rules above and checks:
- a valid story passes;
- a verdict change falls back with the review line;
- a missing field falls back with the review line;
- a missing story falls back with no line;
- a typed number, an unknown placeholder or a banned word fails the story check;
- the rules label covers all 80 cards (each card gets exactly one of the three labels).
