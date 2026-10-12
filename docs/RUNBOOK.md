# Runbook

This runbook keeps the site that tells one story: HN's taste, read back year by year from the full archive. The wording is in docs/NARRATIVE.md.


Who this is for: someone new who has to run the scheduled jobs, deploy the site or recover from a failure. All jobs are GitHub Actions workflows in `.github/workflows/`. Times are UTC.

## Jobs

| Job | Workflow | Schedule | Writes | Must produce |
|---|---|---|---|---|
| Daily update and Pages deploy | `daily-hn.yml` | 02:23 daily, on a push that changes the published site (see Deploy), or by hand | `data/` (rolling dataset, `data/honor.json`, `data/verdicts/log.csv`) and the live site | A green run, a "Deploy Pages" step and a new page on the live site |
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

The site goes live only through `daily-hn.yml`. A push to `main` starts it by itself when it changes the published site: root `.html .js .mjs .css .json .svg .png .jpg .ico .webp` files (not `source.json`), `data/`, `hypotheses/`, `stories/`, `vendor/`, `assets/`, `demo/`, `sample/`, `scripts/stage_site.py`, `scripts/build_share_pages.py`, `scripts/build_hyp_bundle.js` or the workflow itself. A push that only changes docs, tests or other scripts starts nothing. Do not also start it by hand for a push that already started it: the second run only repeats the first. Use `gh workflow run daily-hn.yml -R agamrafaeli-instinct/hn-1m-explorer` only to re-run without a change.

Never push or start a run while a daily or weekly run is in progress: the bot commits to `data/` at the end of the run and the push can collide.

Deploy: push to `main`. If the change touches a published file the workflow starts by itself; wait for a green run and check the live page afterwards.

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
Where each check runs (#250): prepush runs unit tests, copy lint, list version, roadmap, node tests and the UI check at 390 px. CI runs those again, runs the UI check on live data (prepush uses the fixed data in tests/fixtures/ui, #336) and always runs the perf budgets in the daily workflow, with results in the run summary. The phone sweep and the screenshot snapshots run only in CI, nightly. A budget the change needs is raised in the same commit; CI is where a failure shows.


Run `node scripts/perf.mjs --serve /tmp/site_pp --runs 3 --tolerance 1.25` (CI does this on every run; prepush no longer does). Load times on a busy machine are noisy, so treat a result near the limit as a reason to look, and raise the budget in the same commit when the change is real (data/budgets.json and docs/BUDGETS.md).

## First day

Where things are:
- Code and data: https://github.com/agamrafaeli-instinct/hn-1m-explorer. The site is https://agamrafaeli-instinct.github.io/hn-1m-explorer/.
- Board: https://github.com/users/agamrafaeli-instinct/projects/1. The way work moves is in docs/FLYWHEEL.md.
- Scheduled jobs and how to recover each one are in "Jobs" and "Recovery" above.

Steps, from a clean clone:
1. Run the tests: `python3 -m unittest discover -s tests`. It must end with OK.
2. Check the saved weeks: `python3 scripts/verify_weekly.py`. It must say all weeks match.
3. See the site on your machine: `python3 scripts/stage_site.py --root . --output /tmp/site` then `cd /tmp/site && python3 -m http.server 8766`, and open http://localhost:8766/.
4. Run every check CI runs before you push: `bash scripts/prepush.sh` (about 1.5 minutes). The independent checks run in parallel with a log each in /tmp/pp; a failure prints `PREPUSH FAILED in: <names>` and the last lines of those logs. Perf runs alone afterwards. Never push while it shows an error.
5. Push to main. A change to a published file deploys by itself (see Deploy). Docs and tests need no deploy.

When a run fails (the issue already names the failing step, the last 30 log lines and the commit; a time-only budget failure retries once by itself): open the run in the Actions tab, find the step with the red mark, and read its log. The failure issue on the board links to the run. `gh run view <id> --log-failed` shows the same log. The last good site stays live while a run fails. Fix the cause, push, and run it again once.

## Roadmap and board

`python3 scripts/check_roadmap.py` lists open epics that ROADMAP.md does not name, and the other way round. It only warns, and prepush runs it. `--write` rewrites the "Open epics on the board" list in ROADMAP.md from the board. Run it when an epic opens or closes, and commit the change.

## Prepush marker (skip repeat checks in CI)
`bash scripts/prepush.sh` ends by writing `.prepush_ok`, a digest of every tracked and new file except the marker itself (scripts/prepush_digest.py). Commit the marker with the change. The daily workflow checks it right after checkout. Since #336 the marker no longer skips the UI step: prepush checks fixed data and CI checks live data, so both always run. Run `python3 scripts/prepush_digest.py --check` to see which case applies.

## CI caching and skipped steps (#243)
- pip installs are cached by setup-python (`cache: pip`, keyed on `requirements-ci.txt`). Add a new Python dependency there.
- The steps that write film_shares, topic_series, rings and saga data run only when `scripts/inputs_hash.py --check` fails. The hash covers the archive, history, atlas, those four scripts and the current UTC month. The result is stored in `data/film_inputs.sha` and committed with the data. To force a rebuild, delete that file.

## Look at a page at phone width (#244)
`scripts/look.sh '#/rings' [out.png] [js]` stages the site fresh, serves it on port 8766, takes a 390 px screenshot and prints the png path (default /tmp/look.png). The optional third argument is JavaScript to run after load, for example `document.querySelector('#sg9').scrollIntoView()`. View the file with `tools read --file-path`.

## Nightly phone sweep (#245)
`.github/workflows/phone-sweep.yml` runs `scripts/phone_sweep.mjs` against the live site every night (21:17 UTC) and can be started by hand. `scripts/phone_sweep_report.py` builds the issue text. One open issue labelled `phone-sweep` is edited each night; if a night has 0 findings the issue is closed and none is opened. It is a separate workflow, so it never blocks a deploy.

## Copy lint (#246)
`scripts/copy_lint.py` runs in prepush. It fails on an em dash, the two banned archive-size phrases and the banned filler words, all listed in docs/VOICE.md, but only in lines you added since origin/main (and new files). The repo name and URLs are exempt. `--all` lists hits across every checked-in text file without failing.

## Screen snapshots (#247)
`.github/workflows/screen-snapshots.yml` takes 390 px screenshots of home, compare, a fixed week, a card, Explorer and Rings on the live site every night (21:47 UTC). Baselines live in `docs/snapshots`; the first run saves them. A screen with more than 0.5% of pixels changed is listed in one issue labelled `screens-changed` (before, after and diff images are in the run artifact) and the new image becomes the baseline, so a change is reported once. Report only, never a failure. Baselines must come from CI because fonts render differently on other machines. Local capture: `node scripts/snapshots.mjs --out /tmp/snap`; compare with `python3 scripts/snapshots_compare.py base new out`.

## Test fixture (#248)
`tests/fixtures/root` is a small fixed copy of the data layout: 90 stories per month from the archive (the smallest md5 of the id, so the same sample every time), the daily counts and atlas files built from them, and the film shares, topic series, rings and saga files made by the real scripts with `HN_ROOT` pointing there. Rebuild with `python3 scripts/make_fixture.py` (needs data/archive; output is byte-identical on repeat). Tests import `FIX` from `tests/fixture_root.py` and read it instead of live data, so a new month or a daily run cannot break them. Moved so far: film, topic series, rings and saga data tests.

## Card generators (#249)
- `python3 scripts/new_card.py spec.json` makes a film card and what it needs from one JSON spec: the card file, `stories/<id>.json` with its index entry, an optional row in docs/CARD_QUESTIONS.md (give `question`), and a Honor score for the new card (exit 1 if any criterion is False). Fields are listed at the top of `scripts/card_tools.py`. Share pages and test coverage need no file: `stage_site.py` builds a share page for every card and the tests loop over every card.
- `python3 scripts/upgrade_card.py hOLD hNEW [--set audience="curious readers"] [--strong X --weak X --refute X] [--question "..."]` copies an old card under a new id with `"replaces"`, so the old one stays on the site and stops counting as failing. The scorecard no longer calls a card a duplicate of the card it replaces.

## Acceptance checks per ticket (#251)
Each ticket with a visible done-when list gets `tests/acceptance/<n>.mjs` (see the header of `scripts/acceptance.mjs` for the helper calls). `node scripts/acceptance.mjs 265` stages the repo, serves it locally and runs the checks at 390 px; `--site URL` runs them against a deployed site; `--all` runs every file. Before closing a ticket that has a file, run it green and quote the result in the closing comment. A branch push (not main) runs all of them in `.github/workflows/acceptance.yml` without touching the live site. Pilot files: 256, 265, 266.

## Incremental daily run (#252)
`scripts/build_graph.py` saves a hash per check in `data/build_state.json`. The daily run skips the UI check and the perf budgets when the published site files (root html, js, css and json, cards, stories, vendor, assets, the staging scripts) and the check's own script are unchanged since the last good run, and skips the film, topic, rings and saga steps when `scripts/inputs_hash.py` matches. A full run skips nothing: every manual dispatch (unless `skip_unchanged` is ticked) and the Sunday scheduled run. A push always runs the budgets. In a full run, if the film hash said "unchanged" but an output differs, the run fails with `STALE SKIP`. Live data under data/ is not an input to the UI and budget skips; the data checks run every day and the Sunday full run covers growth. `python3 scripts/build_graph.py show` prints each check's state; delete `data/build_state.json` to force one full run.

## Self-healing daily run (#253)
Steps retry on their own (`scripts/retry.sh`). `scripts/contract.py` checks the new data against the last commit; a break is reverted by `scripts/quarantine.sh`, one `data-quarantine` issue is opened, and the last good site stays live. To test, run the daily workflow by hand with `simulate_bad_day` ticked. Details: docs/ALERTS.md.

## UI check on fixed data (#336)
`scripts/make_ui_fixture.py` builds tests/fixtures/ui/data (small data files as they were, 4 explorer chunks sampled every 25th row, the atlas files the screens fetch). `--stage DIR` stages the site code with that data. Prepush runs `tests/ui.test.mjs` on it; the daily workflow still runs it on live data. Rebuild the fixture only to change what the check sees. Measured 15 s against 20 s on live data (the explorer no longer loads 186 chunks).

## QA reviewer (#254)
`node scripts/qa_review.mjs --ticket N --routes '#/a,#/b' [--site URL]` walks the routes at 390 px and writes docs-style report.md plus one screenshot per route (default: stages the repo locally). It lists what a script can see (sideways scroll, taps under 44 px, unnamed controls and charts, tiny text, empty sections, "undefined" or banned words, console errors) next to the ticket's done-when list. It always exits 0. The "QA review" workflow runs it on the live site and posts the report as a comment on the ticket, with screenshots kept on the `qa-reports` branch. Run it from Actions with the ticket number and routes. Whether copy reads well or a chart is clear is judged by whoever reads the screenshots.

## Monthly quarantine drill (#340)
`.github/workflows/quarantine-drill.yml` runs `scripts/quarantine_drill.sh` on the 3rd of each month and by hand. It breaks data/manifest.json inside the runner's own checkout, expects scripts/contract.py to catch it and scripts/quarantine.sh (dry run) to restore the tree, then checks the contract passes again. It never pushes and never opens a data-quarantine issue. Only a failed drill opens one issue labelled `drill-failed` (later failures comment on it). Run it locally only in a fresh worktree: `git worktree add /tmp/dw HEAD && cd /tmp/dw && bash scripts/quarantine_drill.sh`.
The walk also taps the first in-page link and the first button on each route (#344) and says what happened. A link that changes nothing, or any console error or 404 after a tap, is a finding; a button that changes nothing is only noted.
