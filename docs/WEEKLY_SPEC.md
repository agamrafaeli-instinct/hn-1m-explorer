# Weekly "state of HN" snapshot: what counts as rose, fell and new

Status: draft for Agam to approve. Task #33, part of epic #32. Nothing here needs data that is not already in the repo.
Every number comes from the saved weekly files in `data/weekly/`, built by `scripts/weekly_snapshot.py`.

## The week

- Monday 00:00 UTC to the next Monday 00:00 UTC. Labelled by ISO week (for example 2026-W40 is Sep 28 to Oct 4 2026).
- Only complete weeks inside the archive are saved. Only the newest 1,000,000 items are kept (about 10 weeks), so a week that is not saved is lost.
- Stories only for points, comments and hit rate. Dead and deleted items are left out. 89% of archive items are comments with no score, so no comment-level claim is made.
- Scores and comment counts are as first retrieved (the archive does not refresh older items). This holds for every week.

## What each audience tracks

| Audience | Baskets (title word lists, already defined in the repo) |
|---|---|
| Engineers | newsys (rust, zig, rustc, cargo), showhn (titles starting "Show HN"), askhn (titles starting "Ask HN") |
| Deep-tech VCs | deeptech (quantum, fusion, CRISPR, battery, lidar, risc-v and similar; full list in `scripts/terms.py`) |
| Curious geeks | weird, science, retro, history, puzzle, boring (`scripts/geeks.py`) and the 15 round 2 topics (`docs/curious-round2-plan.json`: space, animals, food, music, health, climate, privacy, education, games, books, art, maps, languages, diy, questions) |

Each snapshot stores, for every basket: stories, points, comments, stories with 10+ points, the top 3 stories and top 5 domains.
It also stores week totals, the top 10 stories and the top 15 domains by story count. Each audience screen shows only its own baskets.
Which basket belongs to which audience is one list (`AUDIENCES` in the script). Changing it changes the screen, not the saved data.

## Rose and fell (baskets)

Compare each basket's story count with what last week's share would predict for this week's total:

- expected = last week's basket stories / last week's stories x this week's stories
- difference = this week's basket stories - expected
- Flag the basket when the difference is at least 8 stories and at least 3 times the square root of expected (a rough 3 standard error test for counts).
- Positive means rose, negative means fell.

Why this size: on the 9 week-to-week changes in the saved weeks, a 2 standard error rule flagged 45 of 225 basket-weeks (25 baskets x 9 changes) (about 5 per week, mostly noise). Three standard errors with the 8 story floor flagged 16 (about 2 per week). Weeks with nothing flagged say so ("no big changes") instead of showing a weak one.

Shown per audience: up to 3 rose and 3 fell, biggest difference first. Each line shows last week's count, this week's count and the stories behind it (top 3).

## New (domains)

A domain is new when it has at least 5 stories this week and at most 2 stories last week.
The snapshot keeps every domain with 3 or more stories in a week (`domains`), so a domain missing from last week's list had 2 or fewer.
Up to 5 shown, most stories first. On the saved weeks this finds 0 to 3 domains a week (for example bbc.com, techcrunch.com, reddit.com), so it is not noisy.

Top stories are not "new" (every story is new each week). They are shown as "Top stories of the week": 10 overall and 3 per basket.

## Not claimed

- Rose or fell is about how many stories carry the words, not about interest or opinion.
- A basket flag is a pointer for a closer look, not a finding. Findings are Epic C.
- Backfilled weeks (the first 10) were built after the fact from the archive and say so in their file.
