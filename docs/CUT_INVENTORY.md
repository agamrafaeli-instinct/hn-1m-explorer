# Cut inventory: what serves the story

Decision (2026-10-12): the story is in docs/NARRATIVE.md (one community's taste, read back year by year, one question at a time). This list is for the owner to decide keep, cut or maybe, one item at a time. Nothing is removed until the owner says so.

How to read the evidence. The site has no visit analytics (GitHub Pages gives none), so "usage" means how it is linked inside the site, not how often people open it. "In-site links" counts links to it from the pages and scripts. First-pass judgment: Serves, Maybe or Leftover, with the reason.

## A. Screens (routes)
| # | Screen | In-site links | First pass | Why |
|---|---|---|---|---|
| A1 | Home compare chart (#/) | main entry | Serves | The design center: one chart, one question. |
| A2 | Today's story (#/s/<date>) | 2 | Serves | A single question answered from the archive, one a day. |
| A3 | Story screens (#/story) and monthly charts | 1 | Serves | The core story format. |
| A4 | Explorer (#/explore), year zoom, row search | 5 | Serves | Reads the full archive year by year. This is the tree ring. |
| A5 | Method (#/how) | 1 | Serves | The honest part: how it is computed and caveats. |
| A6 | Topics (#/topics) | 1 | Maybe | Word-list topic charts. Good raw material for taste over time, but it reads as a menu of lists, not a question. |
| A7 | Lesson (#/lesson) | 1 | Maybe | "A fall from a peak is not a return to the past." One teaching page. Reads as a story, but only one and it sits under Method. |
| A8 | Week screens (#/w/<audience>/<week>), 3 audiences, stepper | 5 | Maybe | A weekly news-style readout. It answers "what changed this week", which is the front page kind of question. It could stay as "latest" or go. |
| A9 | Audience pages (#/a/engineers, vcs, geeks) | 7 | Maybe | Split the site by reader type. The pitch has one community, not three audiences. |
| A10 | Hypothesis list (#/hypotheses) and single cards (#/c/hNNN) | 2 and 4 | Maybe | 69 cards. Each card is a guess and a check, close to "one question". The list is a catalogue. See group B. |
| A11 | Lens pages (#/l/<id>, 333 domain and term files, 1.4 MB) | linked only from flagged rows on the week screens | Maybe | Per-domain and per-term views. They live or die with the week screens (A8) and the tracked list. |
| A12 | Submit a hypothesis (#/submit) | 1 | Maybe | Invites outside cards. Not part of the narrative; it is a contribution path. |

## B. Cards (69 files in hypotheses/, by group)
| # | Group | Cards | First pass | Why |
|---|---|---|---|---|
| B1 | Engineers, tools over time (h300-h318, h370-h374) | 24 | Serves | Taste over time, with all-time base windows. Several overlap (h315 Go vs Python, h316 Kubernetes cooling, h317 Vue rising, h318 Java). |
| B2 | Deep-tech themes, share and points premium (h319-h332) | 14 | Maybe | Share and points pairs for six themes plus pooled. Two cards per theme say the same thing twice. |
| B3 | Curious, subject hit rates (h339-h353) | 15 | Maybe | "Space has a higher hit rate", "Animals win", "Food takes over weekends". Reads as trivia lists, fine for taste, but 15 similar ones. |
| B4 | Curious, word families (h354-h369) | 16 | Leftover (first pass) | "Weird words" appears 6 times (h354-h359), "Retro computing" and "Puzzles" twice each. A big overlap. |
Notes: card titles h343, h345 and h357 say "votes". The archive holds points, so those need rewording whatever is decided. README said 80 cards; there are 69.

## C. Features and automation
| # | Item | First pass | Why |
|---|---|---|---|
| C1 | Story finder and Today's story | Serves | One new question a day from the archive. |
| C2 | Weekly findings and weekly save | Maybe | News-style. Weekly saves are the only copy of those weeks, so removing the page is not the same as removing the data. |
| C3 | Honor scorecard and "needs upgrade" issues | Maybe | Quality checks for cards. Fewer cards means fewer upgrades (5 open: #199-#203). |
| C4 | Share pages and Share buttons | Serves | Stories need to travel. |
| C5 | Spyglass tracked domains section on week screens | Maybe | Lives on the week screens. Goes with A8. |
| C6 | Throughline pilots and film cards scripts | Leftover | Build tooling for card groups; kept only so cards can be rebuilt. |

## D. Data and docs
| # | Item | First pass | Why |
|---|---|---|---|
| D1 | data/alltime_pilot.json, curious_round2.json, engineers_history.json | Leftover | Old pilot outputs. Referenced only by their own scripts and tests. |
| D2 | docs/ pilots and plans (THROUGHLINE_*, vcs-*, NEW_CARDS_*, curious-round2-*) | Maybe | Research history. Small, not on the site. |
| D3 | demo/yearzoom.html | Leftover | A demo page that is published with the site and linked from nowhere. |
| D4 | Rolling-window CSVs (data/posts-*.csv, about 300 MB) | Maybe | Plumbing, not a page. Cutting them affects the daily update, so this is an engineering decision, not a content one. |

## How to decide
Go one item at a time. For each: Keep, Cut or Maybe. For a Cut, the next step is a ticket that lists exactly what is removed, what links to it, and what stays in git history. Saved weeks (data/weekly) are never removed by a cut of a screen.
