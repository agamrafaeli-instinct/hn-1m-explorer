# Atlas: incremental plan to cover all of HN since 2006

Epic #109. This is the plan. Numbers marked "estimate" are to be replaced by measurements in slice 0 (#112).

## What is held today (measured 2026-10-09)

- Items: the newest 1,000,000 only, 2026-07-23 to 2026-10-09 (data/posts-*.csv, 346,208,708 bytes, about 346 bytes a row).
- Daily totals: 2022-12-01 to 2026-07-31 (data/history/daily.csv). No items.
- Before December 2022: nothing.
- Item ids run from 1 (2006-10-09) to about 50.0 million now (HN API maxitem 50,020,248). Id 34,000,000 is from 2022-12-15.

So "all HN since 2006" means about 50 million items. At today's row size that is roughly 17 GB of CSV (estimate: 50 x 346 MB). Of those, about 34 million are before Dec 2022 and about 15 million sit in the gap between Dec 2022 and the current window. The gap needs filling too.

## Limits that shape the plan

- Published Pages site: 1 GB at most. Source repository: 1 GB recommended. Pages deploy times out at 10 minutes. Source: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- Repository on-disk size: 10 GB recommended maximum. Source: https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits
- Release assets: each file under 2 GiB, up to 1000 assets per release, no limit on total size or bandwidth. Source: https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases
- Daily workflow job: 120 minute timeout (daily-hn.yml).
- Bulk sources exist for the history, so the 34 million older items need not be crawled one by one through the HN API: the BigQuery table `bigquery-public-data.hacker_news.full` (https://news.ycombinator.com/item?id=40644563) and a Hugging Face dataset (https://huggingface.co/datasets/open-index/hacker-news). Terms, freshness and fields are unchecked and are measured in slice 0.

Conclusion: 17 GB does not fit in the repo or on Pages. Full item files must live outside both. The site publishes small summaries only.

## Principles

1. The site stays live and the daily run stays unchanged until a slice proves itself. Every slice ships something readable and passes its checks before the next starts.
2. Newest to oldest, one year at a time, so the data nearest today is complete first.
3. Full item files are stored one per year (or month for busy years) as release assets. The repo holds only a manifest with row counts, id ranges and SHA-256 per file.
4. Pages publishes summaries: daily and monthly totals, yearly term counts. Item-level pages load a year on demand from the release asset, not from Pages.
5. The rolling newest-window files (data/posts-*.csv) keep feeding the cards and weekly screens exactly as now. Nothing there changes until the cards are told to read by range.
6. Each slice has a size and run-time budget: no Pages file over 50 MB, Pages total under 700 MB, any one job step under 60 minutes, any release file under 1.5 GiB.
7. Saved weekly files are never overwritten.
8. Copy says only what is held. "Since 2006" goes into copy only once 2006 is loaded and checked.

## Slices, in order

| # | Slice | What it ships | Budget and check | Risk |
|---|---|---|---|---|
| 0 | Measure (#112) | Item counts by year, bytes per year in CSV and compact formats, terms and freshness of bulk sources, API speed | Writes the numbers into this file | Source terms may bar redistribution |
| 1 | Storage decision | A yes or no on release assets for full item files | Owner yes or no | Release assets are public |
| 2 | Archive manifest | data/archive/manifest.json and a check that every listed file matches count and hash | Check runs in the daily workflow | None, no data moves |
| 3 | Daily totals 2006 to 2022 | History charts reach 2006 | Under 2 MB, one row a day | Totals differ by source; reconcile on the overlap from Dec 2022 |
| 4 | Fill the gap, Dec 2022 to Jul 2026 | Items for the 15 million missing items, one file per month | Per-month checks: row count, id range, no duplicates, hash | Run time; do it in batches of one month per run |
| 5 | Backfill 2022, then 2021, then 2020 and so on to 2006 | One year per task. Each year adds its items and moves the "held from" date | Same per-year checks; deploy unaffected | 2006 to 2010 have odd records (dead, deleted, missing fields) |
| 6 | Daily run appends to the archive | The retention cap goes away for the archive: items leaving the rolling window are appended to the current month file | Daily run adds under 5 minutes | A failed append must not delete rows from the window |
| 7 | Read by range | Cards and weekly code take a date range; the explorer loads one year on demand | Budgets in data/budgets.json hold | Mobile load size |
| 8 | Reword to "since 2006" | Copy, README and titles claim the start date from the manifest | Search finds no wrong scope claim | None |

Slices 3 and 4 can run in parallel with 2. Slices 5 and 6 must not delete anything from the rolling window. Rollback for each slice: remove its release assets and its manifest lines; the site is unaffected because Pages does not read them until slice 7.

## Owner decisions

1. Slice 1: store full item files as public release assets in this repo (not in the repo or on Pages). Yes or no.
2. Slice 3 and 5: use a public bulk source as the base for pre-2023 data, if its terms allow it. Decided after slice 0 reports.
