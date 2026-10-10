# All-time pilot: five terms, two windows

Status: result of the pilot approved on 2026-10-10. Nothing on the site changed. Old cards are untouched.

## Method

- Source: story files in data/archive, 2006 to Jul 2026 (titles, scores, ids; live stories only).
- Measure: share of stories whose title matches the term (case-insensitive, word boundaries). Same measure for both windows.
- Old window, as the frozen cards use it: Jan to Jun 2023 against Jan to Jun 2026.
- All-time window: every story from 2006 to Jul 2025, pooled, against the latest 12 months (Aug 2025 to Jul 2026). A 2007-only base was tried first and was empty for four of the five terms, because they did not exist yet.
- Verdict rule: copied from card h012. Ratio at least 1.5 is supported (strong), at least 1.15 supported (weak), at most 0.9 refuted, otherwise inconclusive.
- Term patterns are new and documented in scripts/alltime_pilot.py. They are not the lost original patterns, so ratios are not comparable with the old cards.
- Reproduce: `python3 scripts/alltime_pilot.py` (writes data/alltime_pilot.json, with the share by year for each term).

## Result

| Term | Old window ratio | Old verdict | All-time ratio | All-time verdict | Movement |
|---|---|---|---|---|---|
| react | 0.71 | refuted | 0.60 | refuted | same verdict, stronger fall |
| rust | 1.34 | supported (weak) | 2.49 | supported (strong) | strengthens |
| typescript | 1.06 | inconclusive | 1.70 | supported (strong) | flips |
| agents | 29.23 | supported (strong) | 25.75 | supported (strong) | same |
| gpt (chatgpt, gpt-*) | 0.17 | refuted | 2.40 | supported (strong) | flips |

## What it shows

- 2 of 5 verdicts flip and 1 strengthens. The window choice, not the data, decides the answer for gpt and typescript.
- gpt: the share peaked in 2023 (3.1% of stories), so it fell against 2023 and rose against all of history. Both statements are true. A card must say which one it tests.
- react peaked in 2017 (0.90%) and sits at 0.21% in 2026: refuted either way.
- agents is up from about 0.09% of stories in 2022 to 5.7% in 2026.
- Limit: an all-time pooled base is dominated by the recent years, which hold most stories. It is a different question from "first against last".

## Consequence for the scoreboard (#80)

An all-time window ends at the newest data, so every card moves daily and can flip. For the flip rule: cards whose verdict depends on the base (like gpt) will flip when the base changes, so the rule needs the card to state its base window.
