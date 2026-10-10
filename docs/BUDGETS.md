# Performance budgets

Each screen has a limit for load time, bytes and requests on a throttled phone. The limits are in `data/budgets.json` and are read by `scripts/perf.mjs`.

## How it is measured
- Chrome headless, 390x844 at 2x, cold cache (no cache between runs).
- Network: 150 ms round trip, 1.6 Mbps down, 750 kbps up (Lighthouse "slow 4G"). CPU: 4x slower.
- Time is from navigation start until the screen's real content is in the page (not just the shell). The content test for each screen is in `SCREENS` in `scripts/perf.mjs`.
- Each screen is run 3 times and the median is used.
- A screen also fails if the page is wider than the phone (sideways overflow).

## Budgets
Measured 2026-10-09 on the live site. Budget = measured median plus 15 percent, time rounded up to 50 ms.

| Screen | Measured | Budget |
|---|---|---|
| Home | 857 ms, 12 req, 87 KB | 1000 ms, 14 req, 101 KB |
| Audience page | 1858 ms, 17 req, 197 KB | 2150 ms, 20 req, 227 KB |
| One card | 1688 ms, 17 req, 197 KB | 1950 ms, 20 req, 227 KB |
| This week, Engineers | 1566 ms, 20 req, 197 KB | 1850 ms, 23 req, 227 KB |
| This week, VCs | 1617 ms, 20 req, 197 KB | 1900 ms, 23 req, 227 KB |
| This week, Geeks | 1553 ms, 20 req, 197 KB | 1800 ms, 23 req, 227 KB |
| Explorer (before loading data) | 287 ms, 9 req, 37 KB | 350 ms, 11 req, 43 KB |

The story page is not measured yet: its content test did not settle in the script. It is tracked as a follow-up.
Earlier targets were: home about 0.7 s, audience about 1.7 s, card about 1.5 s. The measured numbers are slightly higher because the script waits for the content, not the first paint.

## Run it
```
node scripts/perf.mjs                      # live site, 3 runs per screen
node scripts/perf.mjs --site http://localhost:8000/ --runs 1
node scripts/perf.mjs --only home,card
node scripts/perf.mjs --write-budgets      # re-measure and rewrite data/budgets.json
```
Exit code is 1 if a screen is over budget, never loaded or overflows sideways. Needs Node 22 and Google Chrome. The script is not part of the published site.

## In the deploy workflow

The daily workflow runs `node scripts/perf.mjs --serve _site --runs 3 --tolerance 1.25` after the site is staged and before it is uploaded. The script serves the staged folder on localhost with gzip, like Pages. A screen over its size or request budget, or over its time budget plus 25%, or with sideways overflow, stops the deploy. The last good site stays live. The extra 25% on time is for CI machine speed. The result table is in the run summary.

## UI check
`node tests/ui.test.mjs [--serve DIR | --site URL]` opens the staged site at 390px and checks: home, an audience page, one card, the three week screens, the week stepper (Previous week, then Next week back to the start) and the explorer (load, then a minimum score of 100 must lower the match count). Any console error, failed request, HTTP error or sideways overflow fails the run. It takes about 10 seconds. It runs before deploy in the daily workflow and as its own job in the PR check.
