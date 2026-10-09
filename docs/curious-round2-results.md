# Curious geeks: round 2

15 exploratory title-proxy tests, definitions and thresholds saved before this aggregation. Earlier project summaries were already inspected, so this is not blind or independently preregistered. All 15 remain visible. Supported/refuted are descriptive threshold results, not significance or causal claims; all confidence labels are weak.

Source: current manifest at https://github.com/agamrafaeli-instinct/hn-1m-explorer, generated 2026-10-08T19:15:06.911767+00:00. Read only the manifest-listed chunks, not a glob that could include stale retained files. Of the archive items in that window, 70,571 live stories qualify in ten complete UTC weeks, July 27 through October 4, 2026. Null metric values are excluded from the relevant denominator. Scores/comments are snapshots, not current totals.

Weekly comparisons use equal-weight weekly rates. Weekend comparisons use equal-weight weekday story shares. Growth uses the first three versus last three complete weeks. The full series is graphed on each card.

| Card | Test | Matched stories | Ratio | Threshold result |
|---|---|---:|---:|---|
| H135 | Space hit rate | 906 | 1.1895 | Inconclusive |
| H136 | Animals trimmed points | 305 | 0.8493 | Refuted |
| H137 | Food weekend share | 261 | 0.7104 | Refuted |
| H138 | Music comments/story | 379 | 0.6862 | Refuted |
| H139 | Health comments/point | 554 | 0.9756 | Refuted |
| H140 | Climate comments/point | 179 | 1.2924 | Inconclusive |
| H141 | Privacy comments/point | 528 | 0.8588 | Refuted |
| H142 | Education hit rate | 895 | 0.9669 | Refuted |
| H143 | Games weekend share | 1247 | 1.1458 | Inconclusive |
| H144 | Books trimmed points | 1039 | 1.0718 | Inconclusive |
| H145 | Visual art points/story | 395 | 1.3478 | Supported |
| H146 | Maps/geography hit rate | 466 | 1.2997 | Supported |
| H147 | Linguistics/translation/Unicode share growth | 151 | 0.8589 | Refuted |
| H148 | DIY weekend share | 254 | 1.0450 | Inconclusive |
| H149 | Question-mark comments/story | 4601 | 1.1804 | Inconclusive |

Support threshold is 1.25x, except H140 at 1.50x. Every refuting threshold is at or below 1.00x. Values strictly between the two rules are inconclusive. Full patterns and estimator are in `docs/curious-round2-plan.json`; the generated source stores that plan's SHA-256.

## Reproduce and validate

```
python3 scripts/curious_round2.py
node tests/hypotheses.test.js
node tests/curious_round2.test.js
python3 -m unittest discover -s tests -v
```

Limitations: topic lists overlap; ambiguous words such as library and learning can match software rather than culture. Small groups, heavy tails, title wording, collection timing, unequal score maturity and multiple testing limit interpretation. No multiplicity correction or causal interpretation is offered. Trimming drops ceil(1%) of known-score stories separately per side and week.

The patch leaves shared renderer/router/styles and the generated hypotheses index unchanged. Site staging regenerates the index and discovers all new cards. Local visual checks cover 390px and 1100px cards; no production commit or deployment was made.
