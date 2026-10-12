# Runbook

This runbook keeps the site that tells one story: HN's taste, read back year by year from the full archive. The wording is in docs/NARRATIVE.md.


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
Steps in order: start from the newest main, unit tests, check saved weeks against their hashes, add new items and keep the rolling window, refresh the geeks numbers, refresh film-card monthly shares, find and publish today's story, draft and publish weekly findings, data checks, commit `data/`, stage the site (this also builds the share pages), log verdicts, Honor scorecard, open "needs upgrade" issues (at most 5 a day), UI check at 390px, load-time check, deploy. Any failed step before the deploy leaves the last good site live.

Timing: the cron says 02:23 UTC but GitHub often starts it 15 to 35 minutes late. Check `gh run list -R agamrafaeli-instinct/hn-1m-explorer -L 3` before pushing or starting a run. All runs of the daily and weekly jobs share one queue (concurrency group `hn-daily-pages`), so a second run waits for the first.
Local test: `python -m unittest discover -s tests`.

### 300+ points digest

Run by hand: `gh workflow run watch-350.yml -R agamrafaeli-instinct/hn-1m-explorer`, or `python scripts/watch_points.py` locally.
It must produce `alerts/digest.md` and `alerts/new.md`. State is kept in `alerts/seen.json`, so a story is only reported once.

### Weekly snapshot

Run by hand: `gh workflow run weekly-snapshot.yml -R agamrafaeli-instinct/hn-1m-explorer`, or `python scripts/weekly_snapshot.py` locally (`--week 2026-W31` for one week).
Steps in order: tests, check saved weeks against their hashes, save complete weeks not yet saved, compare weeks (`data/compare/`), build the Atlas aggregates and Lens files, draft and publish weekly findings, export CSV and JSON, record hashes of new weeks, refuse to change any saved week, commit, then start the daily workflow to publish. Output: one new `data/weekly/<week>.json` per complete week, plus its hash in `data/weekly/hashes.json`.

## Recovery

- **A run failed.** Open the run linked in the failure issue. The last good site stays live. Fix the cause, then start `daily-hn.yml` by hand. The next scheduled run also catches up.
- **A step is flaky (a UI or load check).** Re-run once. If it fails twice, treat it as real.
- **A missed week.** Run the weekly workflow by hand. It saves every complete week that is missing. If a week was never saved when it happened, use `python scripts/weekly_snapshot.py --backfill` and read its note: a backfill file says it was built later.
- **A missed digest.** Run `watch-350.yml` by hand. The digest looks at the whole recent window, so nothing is lost.
- **The saved-week check failed.** The message names the week. Restore it from git history (`git checkout <commit> -- data/weekly/<week>.json`). See [INTEGRITY.md](INTEGRITY.md).
- **A UI check fails after a new week or card appears.** Read which check failed. A hard-coded count is a test bug: fix the test, not the data.
- **A saved week looks wrong.** Never edit it. Fix the script, add a test and use `--replace-backfill` only for backfill files with an older schema.
- **A failed deploy.** The previous Pages version stays live. Re-run the failed run from the Actions page. If it fails again, see rollback below.

## Deploy and rollback

The site goes live only through `daily-hn.yml`. A push to `main` that only changes docs or tests needs no deploy. A push that changes `hypotheses/` starts the workflow by itself, so do not start it by hand for that push.

Never push or start a run while a daily or weekly run is in progress: the bot commits to `data/` at the end of the run and the push can collide.

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

## Before pushing a UI or CSS change

Run `node scripts/perf.mjs --serve /tmp/site_pp --runs 3 --tolerance 1.25` (prepush does this). Load times on a busy machine are noisy, so treat a result near the limit as a reason to look, and raise the budget in the same commit when the change is real (data/budgets.json and docs/BUDGETS.md).

## First day

Where things are:
- Code and data: https://github.com/agamrafaeli-instinct/hn-1m-explorer. The site is https://agamrafaeli-instinct.github.io/hn-1m-explorer/.
- Board: https://github.com/users/agamrafaeli-instinct/projects/1. The way work moves is in docs/FLYWHEEL.md.
- Scheduled jobs and how to recover each one are in "Jobs" and "Recovery" above.

Steps, from a clean clone:
1. Run the tests: `python3 -m unittest discover -s tests`. It must end with OK.
2. Check the saved weeks: `python3 scripts/verify_weekly.py`. It must say all weeks match.
3. See the site on your machine: `python3 scripts/stage_site.py --root . --output /tmp/site` then `cd /tmp/site && python3 -m http.server 8766`, and open http://localhost:8766/.
4. Run every check CI runs before you push: `bash scripts/prepush.sh` (about 3 minutes). Never push while it shows an error.
5. Push to main. A change under hypotheses/ deploys by itself. Any other site change needs one run of "Daily Hacker News update and Pages" (Actions tab, Run workflow). Docs and tests need no deploy.

When a run fails: open the run in the Actions tab, find the step with the red mark, and read its log. The failure issue on the board links to the run. `gh run view <id> --log-failed` shows the same log. The last good site stays live while a run fails. Fix the cause, push, and run it again once.

## Roadmap and board

`python3 scripts/check_roadmap.py` lists open epics that ROADMAP.md does not name, and the other way round. It only warns, and prepush runs it. `--write` rewrites the "Open epics on the board" list in ROADMAP.md from the board. Run it when an epic opens or closes, and commit the change.

## Prepush marker (skip repeat checks in CI)
`bash scripts/prepush.sh` ends by writing `.prepush_ok`, a digest of every tracked and new file except the marker itself (scripts/prepush_digest.py). Commit the marker with the change. The daily workflow checks it right after checkout. Only a run triggered by a push (hypotheses/** changes) can skip the UI and budget steps, and only when the digest matches. A missing marker, any edited or added file after prepush, a scheduled run or a manual dispatch runs every check. Run `python3 scripts/prepush_digest.py --check` to see which case applies.
