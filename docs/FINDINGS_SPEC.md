# Findings: how weekly findings are picked and written

Spec for the Headliner epic (#64). A finding is a short written line about one thing that moved. It is not a verdict and not an explanation.

## What may be picked

Only two sources, both already computed:

1. **Flags in the weekly compare files** (`data/compare/<week>.json`): `rose`, `fell`, `new` and a `shares` entry whose `state` is not `steady`. The flag rules are in [WEEKLY_SPEC.md](WEEKLY_SPEC.md) section 7 (a rise needs a difference of at least 8 and at least 3 times the square root of the expected count; a share moves by more than 3 times its usual weekly change).
2. **Verdict flips** from the verdict log (`data/verdicts/log.csv`), using the flip rule in [SCOREBOARD.md](SCOREBOARD.md): the verdict word changed between two logged days in that week. A confidence-only move is a shift and is never listed. Flips go in a separate `flips` list (up to 3), not under an audience. Source line: `Source: data/verdicts/log.csv, card_id <id>, <date> <from>, <date> <to>.`.

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

Decision (2026-10-11): findings publish automatically, with no owner review step, the same as Today's story. Checks replace the review.

1. **Draft.** A script reads the compare file and writes lines in `data/findings/<week>.draft.json`.
2. **Check.** A script checks every line against its source key: the numbers match the file, the line is 25 words or fewer, no banned words, the source line resolves. A line that fails is dropped. A week where every line fails publishes the quiet-week line.
3. **Publish.** Lines that pass are saved to `data/findings/<week>.json` by the daily run, with the run date. Saved findings are never edited. A correction is a new file version with a note.
4. **Show.** The week screen shows the published lines above "What changed". Draft files are never shown.

## Limits

- A flag points at something to look at. A finding only restates it.
- Weeks rebuilt from the archive after they ended carry the backfill note on the screen and in the finding source line.
