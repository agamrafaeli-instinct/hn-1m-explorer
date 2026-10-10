# Atlas architecture: keeping the Explorer over all of HN

Epic #109. Plan for slices: [BACKFILL_PLAN.md](BACKFILL_PLAN.md). This file answers one question: how does the Explorer keep working when the archive is about 50 million items and cannot ship to the browser as CSV?

Labels used below: **measured** (checked on 2026-10-09), **source** (a cited page), **estimate** (reasoned, to be replaced by slice 0 and the prototype).

## 1. What the Explorer does today

Measured from app.js and index.html. It loads data/manifest.json, then the CSV chunks, into typed arrays in the browser (up to the 1,000,000 rows held). It filters the whole array on every keystroke by:
- title words (all words must appear),
- author (substring), domain (substring), type, minimum score, a from date and a to date,
then draws charts (per day, domains, words, authors) and a 25 row paginated list. It has no server and no index; everything is a scan of arrays in memory. The data folder is 335 MB on Pages now (measured, `du`).

## 2. Constraints

- Pages: 1 GB site, 10 minute deploy timeout, soft 100 GB per month bandwidth. [source](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- Pages serves with `access-control-allow-origin: *` and `accept-ranges: bytes` (measured on data/posts-00001.csv). So range reads of Pages files work from the browser.
- GitHub release assets: range reads work (HTTP 206, measured on a public asset), but the response carried no `access-control-allow-origin` header (measured with curl). A browser on our site would be blocked from reading release assets directly. Release assets are therefore an archive for download, not something the Explorer can query. This changes the earlier plan: see section 7.
- Hugging Face dataset files: CORS header echoed our origin and `accept-ranges: bytes` (measured on a public dataset file). A third-party host, so a dependency.
- Size: about 50 million items, roughly 17 GB as CSV (estimate: 346 bytes a row, measured on today's files). About 89% of items are comments with no score or title (measured share 88.6% in the current window). So stories are about 5.5 to 6 million (estimate). Titles average about 35 characters in a 73,000 row sample (measured), so about 200 MB of raw title text (estimate).
- Static only: no server we run, no cost, no accounts beyond GitHub.

## 3. What each Explorer feature needs

| Feature | Needs | Scale problem over 50M |
|---|---|---|
| Counts and charts per day, week, month, year | Totals by period and type | None if precomputed |
| Time range filter | Cut by date | None if data is sharded by time |
| Title word search | Scan titles, or an index | Titles are about 200 MB raw. Too heavy to load all at once on a phone |
| Author filter | Items by author | 50M items by author needs an index or a scan |
| Domain filter | Stories by domain | About 6M stories; a per-domain index is small |
| Minimum score | Scores | Stories only (comments have no score) |
| List of matching items | Rows to show | Needs real rows, only 25 at a time |
| Cards (verdicts) | Aggregates per period | Already aggregate based |

## 4. Approaches compared

| | A. Precomputed aggregates as small static files | B. Year shards of stories, loaded on demand (plain files) | C. DuckDB-WASM over Parquet, range reads | D. A hosted query service |
|---|---|---|---|---|
| Idea | Per period and per term counts, top lists | One file per year with stories only; browser filters in memory like today | Parquet files with row groups; the browser reads only needed byte ranges | A small server runs SQL |
| Size on Pages (estimate) | Tens of MB | 6M stories at about 100 bytes compressed is 600 MB total across all years: too close to the 1 GB cap | Stories-only Parquet about 150 to 300 MB total; comments about 5 GB or more, kept out | None on Pages |
| Cost | None | None | None if hosted on Pages or Hugging Face; WASM engine is about several MB (estimate, unmeasured) | Hosting cost and upkeep, a single point of failure |
| Latency (estimate) | Under 200 ms per query | 1 to 3 s per year loaded on a phone | First query 2 to 5 s (engine plus footer), later queries by range | 100 to 500 ms |
| Static and offline | Yes | Yes after load | Yes after load; needs the host reachable | No |
| Free text search | Only for terms precomputed | Yes inside loaded years | Yes, column scans of titles by year | Yes |
| Arbitrary filter combos | No | Yes, per loaded year | Yes | Yes |
| Risk | Cannot answer a term nobody precomputed | Memory on phones with many years loaded | Unmeasured on phones; CORS needs a capable host | Not static, breaks the project's no-server rule |

## 5. Recommendation: tiers, staged

Use A and C together, with comments out of the browsing path.

- **Tier 1, aggregates (A).** Static JSON on Pages. Per day and per month: counts by type, top 20 domains, top 20 authors, top 30 stories by score, and counts for the top about 20,000 title terms by month. Estimate: 20 to 60 MB. Powers all charts, time ranges across 2006 to now, trends for common terms, domains and authors, and the cards. Works offline after load.
- **Tier 2, stories as Parquet (C).** One file per year, stories only, sorted by time, small row groups, columns: id, time, by, title, url, domain, score, comments. Read by DuckDB-WASM with range requests. Serves free text, author and domain filters, minimum score and the 25 row list for any year. Loaded newest year first, with a visible "searching 2019 of 2006 to 2026" progress.
- **Tier 3, full items.** Every item including comments as yearly files in release assets, with manifest hashes. Download only, not browsable in the Explorer. Comment counts stay in Tier 1.
- **Today's Explorer stays as the default** for the newest window until Tier 2 is proven. Nothing existing is replaced until a stage passes its budget.

Why not B: plain files hit the 1 GB Pages cap and force the whole year into memory. Why not D: breaks the static, no-cost rule and adds an outage risk.

## 6. What degrades, stated plainly

- Comments are not searchable in the Explorer for any year. Their counts and the per-period totals are there. (Today's Explorer also searches titles only.)
- Free text search over all years is not instant: it scans one year at a time with progress, about 6 million titles in total. Common terms answer instantly from Tier 1.
- Author search over all years needs Tier 2 scans for rare authors. Top authors per month are instant.
- Stories only before the rolling window have scores as saved at fetch time, not final scores.
- Phone memory: the Explorer holds at most 3 years at once and drops the oldest.
- The first Tier 2 query costs a few MB for the engine. Not measured yet.

## 7. Change to the storage plan

Slice 1 in BACKFILL_PLAN.md assumed release assets as the store. Release assets cannot be read by the browser (no CORS, measured), so they stay as Tier 3 archive only. Tier 2 story files must live where CORS works:
1. On Pages, if they fit under the budget (stories-only Parquet estimate 150 to 300 MB next to the 335 MB already there). Preferred: no third party.
2. On a CORS-capable host such as a Hugging Face dataset (measured working), only if Pages cannot hold them. This is a third-party dependency and needs the owner's yes.

## 8. Stages, each keeps the site working

| Stage | Ships | Budget | Rollback |
|---|---|---|---|
| 7a | Tier 1 aggregates and charts across 2006 to now (needs slices 3 and 4 data) | Under 60 MB on Pages; chart load under 2 s on slow 4G | Remove the files; Explorer unchanged |
| 7b | Prototype: one year of stories as Parquet, DuckDB-WASM reading it from Pages, measured on a phone at 390px | Engine plus first query under 5 s on slow 4G; peak memory under 300 MB (targets) | Remove the prototype page |
| 7c | Explorer gets a "full archive" mode over Tier 2, newest year first | Pages total under 700 MB; budgets in data/budgets.json hold | Hide the mode |
| 7d | Host decision only if 7c shows Pages cannot hold the shards | Owner yes or no | None |

## 9. Open assumptions to measure

1. Stories-only Parquet size per year (estimate 150 to 300 MB total).
2. DuckDB-WASM engine size and first query time on slow 4G (unmeasured).
3. Share of stories in 2006 to 2022 (assumed about the same as now).
4. Whether Pages range requests keep working for files near 50 MB (measured only on a 40 MB-class CSV).
5. Terms and freshness of public bulk sources.

## Slice 7b prototype measurements (2026-10-10, #122)

Setup: one year of stories (2022, 299,563 live stories, columns id, time, by, title, url, domain, score, comments), sorted by time, Parquet with zstd level 19 and 10,000 rows per row group, built from the Hugging Face monthly files. DuckDB-WASM 1.33.1 (eh bundle) bundled with esbuild, served by a local static server that supports Range and gzip, desktop headless Chrome at 390px. The page was never published, so there is nothing to remove from the site.

| Measure | Value |
|---|---|
| Engine wasm | 35.9 MB raw, 8.1 MB gzip |
| Engine worker script | 0.77 MB raw, 0.19 MB gzip |
| App script with the Arrow reader | 0.22 MB raw, 0.05 MB gzip |
| Engine download total | about 8.4 MB gzip |
| One year of stories | 16.5 MB (299,563 stories, about 55 bytes a story) |
| Engine start | 2.2 to 2.5 s on a fast local link |
| First query (count) | 0.75 to 0.95 s |
| Title search, top 25 by score | 0.42 to 0.75 s |
| Page JS heap | 2 to 3 MB; browser total below |
| Chrome renderer and utility processes, peak | about 1.1 GB resident (headless desktop, includes the browser baseline, not a phone figure) |

What the numbers do not show:
- Slow 4G was not measured. Chrome's network throttle did not apply to the worker and wasm requests (total time stayed under 7 s). By arithmetic, 8.4 MB of engine at 1.6 Mbps (200 KB/s) is about 42 s, and the target of engine plus first query under 5 s on slow 4G is not met on a first visit. A repeat visit can use the browser cache.
- DuckDB-WASM read the Parquet file as one full download (a HEAD, then one GET without a Range header, 16.5 MB) in all three setups tried: SQL on the URL, a registered URL, and a registered URL with direct reads on and ETag headers. Reading only the needed columns by range was not observed. A year costs a full file download until that is solved. At 200 KB/s, 16.5 MB is about 82 s.
- GitHub Pages does answer Range requests: a request for bytes 1000-1999 of data/posts-00016.csv (8,388,608 bytes, the largest file on the site) on the live site returned status 206 with `content-range`, `accept-ranges: bytes` and `access-control-allow-origin: *`. No file near 50 MB is on Pages, so the 50 MB case is not tested.

Reading: with the engine at 8.4 MB and a whole-year file download, Option C is too heavy for a first visit on a phone. Option B (year shards as plain files, loaded on demand) or a smaller per-year file with only the columns the page needs should be compared before 7c. Whether DuckDB-WASM can be made to use range reads is open.


Decision (2026-10-10): public files for older years carry story titles, scores and ids only, with no comment text. Story files in Tier 2 follow this. Comment counts per story and per day come from precomputed aggregates, not from comment rows.
