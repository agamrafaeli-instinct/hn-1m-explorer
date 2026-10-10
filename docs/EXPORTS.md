# Exports

## data/exports/weekly.csv

One row per week and metric, for every saved week. Built by `python scripts/export_weekly.py` from `data/compare/<week>.json`, and rebuilt by the weekly workflow after each new week. Open it in any spreadsheet. It is also published at `data/exports/weekly.csv` on the site. Run `python scripts/verify_weekly.py` first if you need proof the saved weeks are unchanged (see [RUNBOOK.md](RUNBOOK.md)).

| Column | Meaning |
|---|---|
| `week` | ISO week, for example `2026-W40`. |
| `start_utc` | First day of the week, UTC. Weeks run Monday to Sunday. |
| `kind` | `weekly` if saved when the week ended, `backfill` if rebuilt later from the archive. |
| `audience` | `engineers`, `vcs`, `geeks`, `shared` (rows that apply to every screen) or `all` (volume rows). |
| `section` | `volume`, `fact`, `share`, `term` (a flagged term) or `bar: <title>` (a bar chart on the screen). |
| `metric` | The label shown on the screen. |
| `value` | The number for this week. A share is between 0 and 1. |
| `unit` | `stories`, `comments` or `share of stories`. |
| `estimate` | `yes` for hiring-thread counts, which are an estimate, not a thread count. |
| `last_week` | The value the week before, where the screen compares it. |
| `avg_last_4` | Average of the 4 weeks before, for shares. |
| `flag` | `rose`, `fell`, `new` for terms. For shares: `steady` or the state the screen shows. |
| `list_version` | Version of the word lists that produced the counts (data/lists.json). |

## Caveats

- Counts use stories only, unless the unit says comments. Dead and deleted stories keep no title, so title-based shares divide by live stories.
- A word count means stories or comments that carry the word, not interest or opinion.
- A `backfill` week was built after it ended, so recent stories may have had more time to collect points.
- A flag points at something to look at. It is not a finding. Rules: [WEEKLY_SPEC.md](WEEKLY_SPEC.md) section 7.
- Only saved weeks are in the file. It does not claim anything about weeks before the first saved one.
