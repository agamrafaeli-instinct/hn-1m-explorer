# Run alerts

`.github/workflows/run-alerts.yml` opens a GitHub issue labelled `bug` when a scheduled workflow fails or is missed.

- **Failed run.** Fires when the daily update, the 250+ points digest or the weekly snapshot ends in failure. Title: "Scheduled run failed: <workflow>".
- **Missed run.** A daily check at 08:41 UTC looks for a successful run in the last 30 hours (daily update, digest) or 196 hours (weekly snapshot). Title: "Scheduled run missed: <workflow>".
- **One problem, one issue.** While an issue with the same title is open, later failures add a comment instead of a new issue. Close the issue once fixed.
- A failed run never takes the site down. The last good deploy stays live and the next run catches up.
- Decision on record: issue #76.

## What a failure issue says (#242)
The issue and any "Failed again" comment list the failing step, the last 30 lines of its log and the last commit (scripts/failure_report.py builds the text). If attempt 1 failed only because a load time went over budget, the alert workflow re-runs the failed jobs once and opens no issue; if the retry fails too, the issue opens as usual. Any size, request or other failure opens the issue at once. Time over budget only warns since #237, so this retry is a safety net for an old budget file.

## Self-healing run (#253)
- **Retries.** The data update runs through `scripts/retry.sh 3` (a pause of 20 s, then 40 s), so a transient network failure passes on its own.
- **Data contract.** `scripts/contract.py` compares the data the run just built with the last commit: the window keeps its size, chunk rows add up, the scan never goes backward, new rows are a sane number, and no archive file disappears or loses rows. The existing `scripts/data_checks.py` runs later in the same way.
- **Quarantine.** A break does not fail the run and is never saved. `scripts/quarantine.sh` puts every file back to the last good commit, opens one issue labelled `data-quarantine` (later bad days comment on it) and the run carries on, so the site is published from the last good data. Nothing is deleted. Close the issue once a run saves data again.
- **Test it.** Run the daily workflow by hand with `simulate_bad_day` ticked: it breaks the manifest after the update and you should see the issue and an unchanged dataset.
