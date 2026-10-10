# Findings: how weekly findings are picked and written

Spec for the Headliner epic (#64). A finding is a short written line about one thing that moved. It is not a verdict and not an explanation.

## What may be picked

Only two sources, both already computed:

1. **Flags in the weekly compare files** (`data/compare/<week>.json`): `rose`, `fell`, `new` and a `shares` entry whose `state` is not `steady`. The flag rules are in [WEEKLY_SPEC.md](WEEKLY_SPEC.md) section 7 (a rise needs a difference of at least 8 and at least 3 times the square root of the expected count; a share moves by more than 3 times its usual weekly change).
2. **Verdict flips** from the verdict log (`data/verdicts/log.csv`), once the flip rule is decided (see [SCOREBOARD.md](SCOREBOARD.md)).

Nothing else may be picked. No outside news, no guesses about causes.

## How many

Up to 3 findings per audience per week, ranked by the size of the flag (difference divided by the square root of expected, for counts; the multiple of the usual change, for shares). A quiet week with no flags publishes "No big changes this week." and nothing else.

## The line

One sentence of at most 25 words, then a source line. Example:

> Postgres appeared in 49 story titles and texts this week, against about 31 expected from last week.
> Source: data/compare/2026-W40.json, audiences.engineers.rose, key "postgres" (this 49, expected 31.1).

Rules:

- The numbers in the sentence are copied from the file, not rounded further.
- Words stay neutral: "appeared in", "rose", "fell", "new". No "boom", "surge", "crash", no sentiment, no reason why.
- Say "stories" or "comments" as the count says. Hiring counts are labelled an estimate.
- The source line names the file, the path inside it and the key, so anyone can check the number.
- Every finding also carries the standard caveat from the week screen: Hacker News talking, not a measure of what is true.

## Steps

1. **Draft.** A script reads the compare file and writes draft lines in `data/findings/<week>.draft.json`. It does not publish anything.
2. **Review.** An owner reads each draft line against its source and edits or drops it. Each finding is reviewed by the owner before it is published.
3. **Publish.** Approved lines are saved to `data/findings/<week>.json` with the reviewer's date. Saved findings are never edited. A correction is a new file version with a note.
4. **Show.** The week screen shows the approved lines above "What changed". A draft is never shown.

## Limits

- A flag points at something to look at. A finding only restates it.
- Weeks rebuilt from the archive after they ended carry the backfill note on the screen and in the finding source line.
