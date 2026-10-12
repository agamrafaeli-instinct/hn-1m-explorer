# Estimate review (2026-10-12)

Scope: 175 closed tasks (Oct 8 to Oct 12, 89 hours of calendar time) and the 67 rows in docs/ESTIMATES.csv.

## What the numbers say
- Throughput: 175 tasks in 89 hours, about 2 an hour of calendar time. 94 closed on Oct 10, 29 on Oct 11, 34 on Oct 12.
- Stated estimates (S 0.75 h, M 2 h, L 4 h) were set for 38 of the closed rows and add up to 37.5 h. Logged actuals for all 67 rows add up to 14.7 h. Median actual was 0.15 h for L, 0.08 h for M and 0.01 h for S.
- The logged actuals are not trustworthy. Many rows show 0.00 to 0.02 h because the start was logged late or failed (the helper needs the GitHub token and died without it) and several tickets were closed in one sitting. The gap between one close and the next is a better measure of cycle time: median under 30 minutes, 11 gaps over an hour.
- Later tickets lost their estimate_h entirely (blank in the file after about #170), so the rows can not be compared with a prediction.
- Buckets were too big: even L tasks took about 10 minutes of work to 1 hour. They were sized for a human team.

## Where the time went
Longest tasks, by logged hours: #173 (1.4 h), #121 Slice 7a precomputed aggregates for all years (1.1 h), #169 (1.1 h), #218 integrity manifest for saved weeks (1.0 h), #198 row-level search over all years (0.6 h), #119 Explorer opens on the full history (0.6 h), #229 Tracked section on week screens (0.6 h).
Common thread: they touched the data pipeline or a new page behind the build, so they needed a data rebuild, a staging pass and a deploy to check.

Fixed costs of any ticket that changes the site: tests about 10 s, prepush about 2.5 min, deploy run about 4 to 6 min, phone check by screenshot 1 to 2 min. Floor: about 10 to 15 minutes for the smallest deployed change. Docs-only tickets have no floor beyond the tests.

## Misses and their causes
1. Hard-coded assumptions failed in CI, not in local runs. Two failed runs on Oct 12: a UI test with a fixed count of saved weeks (run 38212679566), and an audience page load-time budget that had drifted up (run 38225008868, 3057 ms against 3000 ms). Each cost one fix, one redeploy (about 6 minutes) and a report.
2. Local checks that are noisy. Local perf is noisy and card was over budget at baseline, so a local pass or fail told little.
3. Late or missing time logging, so the estimate system could not learn (see above).
4. Batching. Several small tickets were closed from one commit (Toolbox runbooks #224, #225 at 0.0 to 0.01 h), so their sizes are not separable.
5. Over-sized buckets: 11 L and 35 M tasks finished far under their size.
6. Scope that was not a task: epics #153, #133, #167 had their tasks done long before grooming caught up, so the Ready queue ran empty without notice.

## Rules for estimating from now on
1. Estimate in minutes, in these buckets: Docs or script only 10 min. Small UI or copy change on an existing page 20 min. New page or section from existing data 30 to 45 min. Anything that adds data, a build step, a workflow or a new data file 60 to 90 min. Add 10 minutes when the change is deployed (prepush plus run).
2. Add 15 minutes of risk for any ticket that adds a count, a size or a time that a test or budget checks. Before pushing, grep tests/ and data/budgets.json for what it touches.
3. A ticket that changes the build, a workflow or the deploy path is the most likely to blow up. Double its estimate and run a dispatch of the workflow before closing.
4. Do not stack more than 3 deploy-needing commits in one hour: each needs a clean run, and a failed run blocks the rest.
5. Log time the same way every time: run `est.py start N` when the ticket moves to Dev, with the token set, and check the output says "started". Write estimate_h at grooming, never leave it blank.
6. When tickets are batched in one commit, split the logged time evenly and mark them "batched".
7. Re-calibrate monthly: median of actual divided by estimate per bucket. Adjust the bucket when a size has 5 or more rows.
8. Check the queue at every close: if fewer than 5 Ready tasks remain, say so in the report so grooming is not left until the queue is empty.

## Fixes already made
- Budget drift: audience budget raised to 2850 ms and a RUNBOOK note to run perf before pushing UI or CSS changes.
- The UI lens test reads the week count from data/weekly/index.json.
- est.py help: needs GH_TOKEN. Fixed in #240: scripts/est.py reads the token itself and prints a plain message on failure; the ledger is in minutes.
