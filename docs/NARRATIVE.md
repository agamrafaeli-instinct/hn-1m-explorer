# The narrative

Source of truth for how the site, its docs and its tickets talk about the project. Decision (2026-10-12): chosen by the owner. Every doc, page and ticket should read from it.

> HN swears it's about everything. We counted. Twenty years of posts and points say it's about something much more specific: one community's taste, repeating itself - the clever hack, the doomed startup autopsy, the obscure paper that suddenly matters again. The front page changes daily. The taste doesn't. And because every story's points were recorded, that taste can be read back, year by year, like a tree ring.
>
> That's what this site does. Each story takes one question you can't answer from the front page, asks it of the entire archive, and lets the data answer honestly. Not what HN claims to be about. What it has always, demonstrably, been about.

## What it means for the work
- One story is one question you cannot answer from the front page, asked of the full archive, answered by the data. Cards, weekly screens and Today's story are all stories.
- The scope is every story since 2006. Nothing is scoped to a window unless the story is about that period.
- Taste over time: show how the same community's interests repeat, change and come back. Year by year is the natural unit.
- Honest means shown with its caveats: wrong guesses stay on the page, and every claim is sourced.
- Content that does not serve a story is a candidate for removal. Nothing is removed without the owner's sign-off.

## Careful with the wording
- Decision (2026-10-12): the pitch says "points", not "votes". The archive holds points per story as collected, not each vote, and scores for 2025-26 are low, so those years use ratios (see docs/INTEGRITY.md and the Method page).
- Say "full archive" or "every story since 2006", never "1M" (only the repo name keeps it).

## What the data has shown so far (added 2026-10-13, from the shipped essay)
These are results, not decisions. The pitch above is the owner's wording and is unchanged; the essay on the home page reports what the numbers say.
- Year by year (#/rings, essay beat 3): in six general-interest themes (space, games, privacy, health, history, science) 2010 and 2025 look almost the same. In six technology themes they do not: React peaked in 2017, Rust and LLMs are highest in 2026. So the pitch line "the taste doesn't change" holds for the general themes and not for the technology ones. Source: data/rings.json, docs/RINGS_FINDING.md.
- Concentration (essay beat 4): the top 1% of the 543,583 sites hold about two thirds of all points. Source: data/atlas/concentration.json.
- Quiet, then back (#/phoenix, essay beat 4): 285 returns, median quiet spell 37 months, no anniversary pattern, 261 of 285 fell quiet again within a year. Source: data/resurfacing/groups.json, docs/RESURFACING_SPEC.md.
- The essay's closing answer (beat 5) lists what the archive cannot settle: no comments, titles only, points versus timing, partial years, no cause tested.
