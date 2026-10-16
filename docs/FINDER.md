# Story finder

One story a day, picked and published by the daily run (Decision 2026-10-11: no review gate). Title matching only. Archive scores for 2025-26 are low for all stories, so only shares of titles are used.

## Steps in the daily run (daily-hn.yml, step "Find and publish today's story")
| Step | Script | Writes |
|---|---|---|
| 1 Candidates | scripts/finder_candidates.py | data/finder/candidates.json |
| 2 Rank and pick | scripts/finder_select.py | data/finder/queue.json, data/finder/<date>.json |
| 3 Word list for the pick | scripts/finder_dictionary.py term <id> | data/finder/dictionaries/<id>.json |
| 4 Publish | scripts/finder_publish.py | the story block and card id in data/finder/<date>.json, data/finder/latest.json, data/finder/shown.json, hypotheses/h4xx-<id>-story.json |

`scripts/finder_dictionary.py bursts` writes data/finder/bursts.json, new candidate terms from title word and two-word bursts. It is not in the daily run yet.

## Thresholds and where they are set
| Rule | Value | Set in |
|---|---|---|
| Ratio counts as up / down | 1.25x or more / 0.8x or less, between is flat | finder_candidates.py (UP, DOWN) |
| Minimum matches | 30 in the smaller window | finder_candidates.py (MIN_N) |
| Spike | latest month at least 1.25x the highest month of the 12 before | finder_candidates.py |
| Windows | latest 12 months, all earlier months, the 12 months before, peak calendar year (1000+ stories) | finder_candidates.py |
| Rank | score = effect x sturdiness; effect is the largest abs(ln ratio); sturdiness is the share of ratios pointing the same way. Ties break on term name | finder_select.py |
| No repeat | a term is skipped for 90 days after it is shown | finder_select.py (COOLDOWN_DAYS) |
| Burst terms | at least 30 titles in the latest year and at least 3x the share of the 3 years before | finder_dictionary.py (MIN_N, BURST_RATIO) |
| Scoreboard card | supported at 1.25x, strong at 1.5x, refuted at 0.8x, latest 12 months against all earlier months | finder_publish.py (WEAK, STRONG, REFUTE) |

## Guardrails (tests/test_finder_guardrails.py fails the build on any of these)
- A published story has dated windows (from and to) in its rows.
- The smaller window has at least 30 matches.
- The word list file exists and the term is in data/finder/shown.json.
- The scoreboard card exists, reads data/film_shares.json and has the rule written on the publish date.
- A rerun on the same date keeps the pick (tests/test_finder_select.py, tests/test_finder_publish.py).

## Reusing a published test

The publisher reuses a story-finder card only when its full comparison and verdict rules match exactly and its original rule date is recorded. The dated story keeps that original date and says that the test is reused. A comparison with different thresholds is a different test. Published cards and dated stories are never rewritten. Genuinely new cards carry title-matching, exploratory-selection and interpretation caveats.

This prevents future duplicate tests. It does not repair quality flags on cards already published, and a distinct rule can still be flagged by the quality check for using an older comparison.

## Limits
The term was picked because its numbers stood out, so the scoreboard card tests it on the current data and is not a prediction. Spike uses the latest month, not 4 weeks, because the film data is monthly. The anomaly generator (domains, title patterns, score distribution) is not built.
