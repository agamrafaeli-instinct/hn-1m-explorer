# Run alerts

`.github/workflows/run-alerts.yml` opens a GitHub issue labelled `bug` when a scheduled workflow fails or is missed.

- **Failed run.** Fires when the daily update, the 250+ points digest or the weekly snapshot ends in failure. Title: "Scheduled run failed: <workflow>".
- **Missed run.** A daily check at 08:41 UTC looks for a successful run in the last 30 hours (daily update, digest) or 196 hours (weekly snapshot). Title: "Scheduled run missed: <workflow>".
- **One problem, one issue.** While an issue with the same title is open, later failures add a comment instead of a new issue. Close the issue once fixed.
- A failed run never takes the site down. The last good deploy stays live and the next run catches up.
- Decision on record: issue #76.
