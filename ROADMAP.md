# Roadmap

Last updated: 2026-10-09. Board: https://github.com/users/agamrafaeli-instinct/projects/1 (public).

## Vision

People come back about once a week to see how current AI trends are changing the Hacker News conversation, each from their own audience's perch (engineers, deep-tech investors, curious readers). The site should always answer one question: what is going on on HN, and how has it changed over time?

## How we track work

- How to write issues and board text: [docs/ISSUES_STYLE.md](docs/ISSUES_STYLE.md).
- How work moves: [docs/FLYWHEEL.md](docs/FLYWHEEL.md).
- Board fields: **Status** (Defined, Grooming, Ready, Dev, QA, Done, Needs decision) and **Horizon** (Now, Next, Later). Start and Target dates feed the timeline.
- Each epic below becomes one GitHub issue labelled `epic`, broken into task issues when the owner picks which epic goes first.
- Epic order: an owner decision, not set yet. Epics are named by code name (Pulse, Tally, Headliner and others on the board).
- Rules that apply to all of them: sourced claims only (HN FAQ and API docs, or the repo's own data), simple words, a phone-first layout checked at 390px, no new top-level site file without adding it to scripts/stage_site.py, and the owner reviews anything that reads as a finding before it goes live.

## Pulse: Weekly state of HN per audience

A short snapshot each week for each audience: what rose, what fell, what is new. Compared with the week before.

What exists now: weekly term series for the newest 10 weeks (data/summary.json, terms.weekly), the daily 250+ point digest (alerts/), and monthly history from Dec 2022 (data/history/).

What is missing:
- Only a rolling window of the newest items is kept in the main archive, which is about 10 weeks. A weekly job must save each week's snapshot (for example data/weekly/YYYY-Www.json) or the history is lost. The 10 weeks already in summary.json can backfill the first snapshots.
- A definition of "rose", "fell" and "new" per audience (which terms, domains and stories count, and what size of change is worth showing).
- A screen on the site for the current week plus a way to step back through earlier weeks.

Done when: each audience screen opens on this week's snapshot, with last week's comparison, and the snapshot is saved every week without anyone touching it.

## Tally: Running hypothesis scoreboard

All hypothesis cards in one scoreboard with their verdicts over time. A card that changes verdict is flagged.

What exists now: 80 cards, each with a verdict computed at deploy time (hypotheses/tally.json is rebuilt each deploy and does not keep history).

What is missing:
- A saved log of each card's verdict per run (for example data/verdicts/log.csv), so flips can be found.
- A rule for what counts as a flip, including when the verdict moves between strong and weak.
- Only cards fed by refreshing data can change. Cards on fixed windows (H135-H149, the history cards) cannot flip, and the scoreboard must say so instead of implying they are monitored.
- A scoreboard screen and a visible "flipped" marker on the card.

Done when: the scoreboard shows every card's current verdict and its history, and a flip shows up on the card and on the scoreboard the same day.

## Headliner: Weekly narrative findings

Two or three short findings each week, written like a magazine piece: a plain headline, a few sentences, one chart.

What exists now: the narrative card layout (guess, check, what we saw, verdict) and the story page.

What is missing:
- A weekly pick of the two or three most interesting changes, taken from Pulse snapshots and Tally flips (so it depends on at least one of them).
- A draft step: an agent drafts each finding from the data only, and the owner reviews before it is published.
- A page for the latest findings and an archive.

Done when: every week there are two or three published findings, each traceable to numbers in the repo.

## Dependencies and order notes

- Headliner needs input from Pulse or Tally, so it cannot ship first on its own.
- Pulse and Tally both need a weekly saved record. They can share one weekly job.
- Order is an owner decision.
