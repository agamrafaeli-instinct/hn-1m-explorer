# Submit a hypothesis

Guess something about HN, say in advance what the data must show, and let the site check it.

1. Fork the repo.
2. Copy `hypotheses/h001-weekday-rhythm.json` to `hypotheses/hNNN-your-name.json`. Use the next free number; `id` must match the file name prefix.
3. Fill in the card. Fields are in `HYPOTHESES.md`. Set the verdict thresholds before you look at the result, and include a rule that refutes you.
4. Run `node tests/hypotheses.test.js`. It shows the verdict your card would get.
5. Open a PR with only that file. The PR template has the checklist.

A check runs on the PR. It fails if the card is malformed, has no refuting rule, points at data that does not exist, or touches other files. A maintainer reviews, then merges.

After a merge to `main`, the card is published as a finding on the next deploy. The verdict is computed from the data, not typed by anyone. Failed hypotheses are shown too; that is the point.

Do not edit `hypotheses/index.json` (generated). New stats or data sources need a code change to `hyp-eval.js`, in a separate PR.
