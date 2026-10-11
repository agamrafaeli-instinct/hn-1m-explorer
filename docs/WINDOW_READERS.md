# Who reads the rolling window

Decision (2026-10-11): no part of the system works over a window unless it is chosen on purpose to tell a story, and a window is never a default. The 1,000,000-row window in data/posts-*.csv (cap: RETENTION_ROWS in scripts/update_daily.py) stays only as plumbing. This list is every reader found on 2026-10-12 (searched for posts-*.csv, data/manifest.json and data/summary.json in scripts, site code and workflows), and what happens to each.

Plumbing means: the daily run needs recent items to build the numbers below. Nothing may name the window as a scope. Stories that leave it are kept in data/archive (#118).

| Reader | What it uses | Fate |
|---|---|---|
| scripts/update_daily.py | window CSVs, builds data/summary.json | Stays. It is the plumbing. Archives leaving stories. |
| scripts/geeks.py, add_terms.py, terms.py, concentration.py | window CSVs or summary.json, for weekly basket and concentration numbers | Stay as plumbing. Their output is labelled by week, not by window. |
| scripts/weekly_snapshot.py, curious_round2.py | manifest and window, to save complete weeks | Stay. A saved week is a chosen period. Weeks older than the window come from the archive (backfill marker already shown). |
| scripts/data_checks.py | manifest and archive manifest | Stays. Add a check that no coverage claim is a count taken from the window once #196 lands. |
| scripts/vcs_discover.py, vcs_holdout.py | manifest, for card research | Research scripts. Frozen. No change. |
| scripts/history_strips.py, build_story_file.py, stage_site.py | data/history, archive, site staging | Already full history. |
| scripts/atlas_aggregates.py (new) | archive and daily counts | Full history. |
| story.js (home) | data/summary.json and data/manifest.json: dek "newest items held here, from d0 to d1", file size line | Moves to the full history. Task #195. |
| app.js (Explorer) | manifest and CSV chunks, "Newest N files" picker | Moves to the full archive. Task #119. |
| hyp-eval.js and the hypothesis cards | data/summary.json | Cards that say "last 12 complete months" use a chosen period and stay, labelled as chosen. Cards with no stated period are checked in #195 and labelled or moved. |
| tools/make_sample.py | sample data for tests | Test fixture. No change. |

Not changing here: the cap size, the repo name, the saved weeks. Copy changes only after the data behind it changes (#196).
