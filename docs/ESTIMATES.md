# Estimates

Every task gets a time estimate when it is groomed to Ready. Epics have none.

- **Where.** The ticket body says `Estimate: N min` (minutes). Project field "Estimate (h)" holds the same value in hours (minutes divided by 60) and shows on the board and as a chip on Grandstand cards. The issue body keeps the S/M/L size.
- **Buckets (minutes, from docs/ESTIMATE_REVIEW.md).** Docs or script only: 10. Small UI or copy change on an existing page: 20. New page or section from existing data: 30 to 45. Anything that adds data, a build step, a workflow or a new data file: 60 to 90. Add 10 for a deployed change and 15 when a test or budget checks a count, size or time. Double a change to the build, a workflow or the deploy path. A task can carry its own value when a bucket is clearly off.
- **Actuals.** Run `python3 scripts/est.py start N` when a task moves to Dev and `python3 scripts/est.py done N` when it closes. The ledger `docs/ESTIMATES.csv` is in minutes (`estimate_min`, `actual_min`); the project field "Actual (h)" gets hours. The script reads the token itself and prints a plain message when anything fails. `est.py check` lists Ready or Dev tasks with no estimate in minutes; it must print 0.
- **Calibration.** Median of actual / estimate per size, plus the share of tasks within 50% of their estimate. Buckets are adjusted once a size has 5 or more closed tasks. Accuracy is reported with progress updates.
- **Caveat.** Hourly wakes and queue waits are not work time. Actuals measure elapsed time in Dev, so early numbers will run high.
