# Estimates

Every task gets a time estimate when it is groomed to Ready. Epics have none.

- **Where.** Project field "Estimate (h)" (hours, shown on the board and as a chip on Grandstand cards). The issue body keeps the S/M/L size.
- **Buckets.** S = 0.75 h, M = 2 h, L = 4 h. A task can carry a custom hour value when the bucket is clearly off.
- **Actuals.** When a task moves to Dev its start time is written to `docs/ESTIMATES.csv`. When it closes, actual hours (Dev start to Done) are written to the same row and to the project field "Actual (h)".
- **Calibration.** Median of actual / estimate per size, plus the share of tasks within 50% of their estimate. Bucket hours are adjusted once a size has 5 or more closed tasks. Accuracy is reported with progress updates.
- **Caveat.** Hourly wakes and queue waits are not work time. Actuals measure elapsed time in Dev, so early numbers will run high.
