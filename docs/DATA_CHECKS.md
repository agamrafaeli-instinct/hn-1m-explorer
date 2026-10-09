# Data checks

`scripts/data_checks.py` checks the rolling archive. It prints one line per check and exits 1 if any fails. Run it with `python3 scripts/data_checks.py`. Unit tests with a failing example for each check are in `tests/test_data_checks.py`.

| Check | Limit | Measured 2026-10-09 | Why |
|---|---|---|---|
| total_rows | rows counted in the files equal the manifest total_rows | 1,000,000 (equals manifest) | The manifest is the source of the total; no fixed number is hard coded. |
| chunk_row_counts | every chunk file has the row count in the manifest | 0 differ | Catches a cut or doubled file. |
| chunk_sha256 | every chunk matches the manifest hash | 0 differ | Catches a changed or damaged file. |
| duplicate_ids | 0 | 0 | An ID is one item. |
| unknown_item_types | 0 | 0 | Only story, comment, job, poll, pollopt. |
| missing_or_bad_time | 0 | 0 | Every item has a time. |
| dead_share_stories | 0.20 to 0.45 | 0.3085 | About 31% of stories are dead or deleted (docs/WEEKLY_SPEC.md). A jump means a fetch problem. |
| median_story_score | 1 to 6 | 3 | Stories that are live and have a score. Points per story shift level over time, so the range is wide. |
| max_gap_hours | 0 to 6 | 0.4 | Longest quiet stretch between two consecutive items. A long gap means missing days. |
| comment_share | 0.75 to 0.93 | 0.886 | About 89% of items are comments. |

Limits are wide on purpose. They catch broken data, not normal weekly movement. Change a limit only with a new measured value in this table.
