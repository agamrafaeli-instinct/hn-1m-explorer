# Runbook

Who this is for: someone new who has to run the scheduled jobs, deploy the site or recover from a failure. All jobs are GitHub Actions workflows in `.github/workflows/`. Times are UTC.

## Jobs

| Job | Workflow | Schedule | Writes | Must produce |
|---|---|---|---|---|
| Daily update and Pages deploy | `daily-hn.yml` | 02:23 daily, on a push that changes `hypotheses/`, or by hand | `data/` (rolling dataset, `data/honor.json`, `data/verdicts/log.csv`) and the live site | A green run, a "Deploy Pages" step and a new page on the live site |
| 300+ points digest | `watch-350.yml` | Every 2 hours at minute 41 | `alerts/` (`digest.md`, `new.md`, `seen.json`, `alerts.json`) | A commit in `alerts/` when a new story passed 300 points |
| Weekly snapshot | `weekly-snapshot.yml` | Mondays 05:17 | `data/weekly/<year>-W<nn>.json` and `data/compare/` | One new file per complete week, then a site deploy |
| Run alerts | `run-alerts.yml` | After the jobs above, and a missed-run check at 08:41 daily | One GitHub issue per failure | Nothing when all is well |

### Daily update

Run by hand: `gh workflow run daily-hn.yml -R agamrafaeli-instinct/hn-1m-explorer`.
Steps in order: unit tests, add new items and keep the rolling window, refresh the geeks numbers, data checks, commit `data/`, stage the site, log verdicts, Honor scorecard, open "needs upgrade" issues (at most 5 a day), UI check at 390px, load-time check, deploy. Any failed step before the deploy leaves the last good site live.
Local test: `python -m unittest discover -s tests`.

### 300+ points digest

Run by hand: `gh workflow run watch-350.yml -R agamrafaeli-instinct/hn-1m-explorer`, or `python scripts/watch_points.py` locally.
It must produce `alerts/digest.md` and `alerts/new.md`. State is kept in `alerts/seen.json`, so a story is only reported once.

### Weekly snapshot

Run by hand: `gh workflow run weekly-snapshot.yml -R agamrafaeli-instinct/hn-1m-explorer`, or `python scripts/weekly_snapshot.py` locally (`--week 2026-W31` for one week).
It saves every complete week that is not saved yet, writes `data/compare/`, and refuses to change any saved week. It then starts the daily workflow to publish.

## Recovery

- **A run failed.** Open the run linked in the failure issue. The last good site stays live. Fix the cause, then start `daily-hn.yml` by hand. The next scheduled run also catches up.
- **A step is flaky (a UI or load check).** Re-run once. If it fails twice, treat it as real.
- **A missed week.** Run the weekly workflow by hand. It saves every complete week that is missing. If a week was never saved when it happened, use `python scripts/weekly_snapshot.py --backfill` and read its note: a backfill file says it was built later.
- **A missed digest.** Run `watch-350.yml` by hand. The digest looks at the whole recent window, so nothing is lost.
- **A saved week looks wrong.** Never edit it. Fix the script, add a test and use `--replace-backfill` only for backfill files with an older schema.
- **A failed deploy.** The previous Pages version stays live. Re-run the failed run from the Actions page. If it fails again, see rollback below.

## Deploy and rollback

The site goes live only through `daily-hn.yml`. A push to `main` that only changes docs or tests needs no deploy.

Deploy: push to `main`, then `gh workflow run daily-hn.yml -R agamrafaeli-instinct/hn-1m-explorer`, and wait for a green run. Check the live page afterwards.

Rollback:
1. Find the bad commit: `git log --oneline -20`.
2. Undo it with a new commit, never a force-push: `git revert <sha>`.
3. Run the tests: `python -m unittest discover -s tests` and `node tests/ui.test.mjs --serve <staged site>`.
4. Push to `main` (fetch and rebase first, because the bot also commits).
5. Start the daily workflow by hand. When it is green, the old behaviour is live again.
6. If the revert itself is blocked, open the last green run in Actions and re-run its deploy job to put that version back.

Rollback was rehearsed on a local branch on 2026-10-10: revert of a test commit, the unit tests and the site staging step all passed. A real deploy of a branch was not tried, because Pages deploys only from `main`.

## Token

- The workflows use the token GitHub creates for each run (`GITHUB_TOKEN`). It lives only inside the run, is never stored and has no expiry to renew.
- Manual pushes and board changes need a personal access token. It lives in the owner's password manager or in the environment of whoever is working, never in the repo, an issue or a message.
- A token has an expiry date set when it is made. Renew it before then: create a new fine-grained token in GitHub settings for this repo only (contents, issues, actions and projects write), put it in the password manager, then delete the old token in GitHub. Pass it to commands through an environment variable, for example `export GH_TOKEN=...`, typed into the shell or read from the password manager. Do not write it to a file in the repo.
- If a token may have leaked, delete it in GitHub settings first, then make a new one.
