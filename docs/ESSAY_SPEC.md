# Home essay spec

Epic Saga #258. Spec for #259. Status: written to match what is built and what is planned. The owner reviews it, and beats that interpret data wait for his text (#262, #263, #264). Voice rules: docs/VOICE.md. Pitch: docs/NARRATIVE.md. Rows 1, 2, 3 (component) and 6 are live.

## Beats, in order
| # | Beat | Section id | Data behind each number | Status |
|---|---|---|---|---|
| 1 | The hook: "HN swears it's about everything. We counted." | `#sg1` | No numbers. Text from docs/NARRATIVE.md. | Live (#260) |
| 2 | Every story, counted: stories per year and points per story | `#sg2` | data/saga.json, built by scripts/saga_data.py from data/history/daily.csv. Source line on the page. Hollow bars mark years with low points (2023, 2026). | Live (#261) |
| 3 | Year by year: what HN rewarded | `#sg3` | The Rings component (rings.js): data/film_shares.json, data/atlas/tops-YYYY.json, data/atlas/concentration.json. Text between the rings waits for the owner (#262, #276). | Component live, text pending |
| 4 | The surprises: 2 or 3 findings only the full archive shows | `#sg4` | One source file per finding, chosen with the owner (#263). Candidates come from data/resurfacing/groups.json and data/atlas. Each has a number, a chart and a caveat. | Pending owner picks |
| 5 | The answer, and what it cannot settle | `#sg5` | Same files as beats 2 to 4. Text names what the archive cannot show (no comments, partial years, title-only matching). | Pending owner text (#264) |
| 6 | Start anywhere: a search box and one-tap doors | `#sg9` | No numbers. Links to #/explore, #/rings, #/hypotheses, #/w/engineers/, #/topics, #/compare, #/how. | Live (#265) |

## Layout at 390 px
One column, each beat at least a screen tall except the doors. A thin progress bar at the top (`#saga_bar`). The hook fills the first screen with a "Scroll" link. Charts are 64 px bars with labels on line ends and no legend. Tap targets are 44 px or more.

## Where the old home parts went
| Part | New place |
|---|---|
| Compare chart and menu | `#/compare`, linked from the doors |
| Latest week link | `#/compare` footer and the "This week" door |
| Topics | `#/topics`, linked from the doors and `#/compare` |
| Today's story line | `#/s/<date>` page, unchanged; the line stays on `#/compare` |
| Three audience pages | Removed (#256). Old links go to `#/hypotheses` |
| Menu tabs | Home, Explorer, Submit, Method. Home is the essay |

## Rules for numbers
Every number carries its source file and field, the unit, and the 2023 and 2026 points caveat. Beat text that reads the data (drift or repeat, what the surprises mean) is written after the owner has seen the data and approves it. Nothing here says the taste repeats or changes.
