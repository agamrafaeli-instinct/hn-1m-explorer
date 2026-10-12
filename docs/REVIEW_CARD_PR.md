# Reviewing a card PR

For the owner. Takes a few minutes. Every item can be checked from the PR page.

1. **One file.** The Files tab shows one new file, `hypotheses/hNNN-short-name.json`. The PR check enforces this; a red check here means stop.
2. **Check is green.** The Hypothesis PR check passed. If it failed, the Summary page says what to change. Send the contributor to CONTRIBUTING.md.
3. **Thresholds before the result.** Read `expect` and `verdicts`. The numbers should be round and come from the guess, not from the verdict shown in the check log. Ask: could these lines have been written without looking at the data?
4. **A way to be wrong.** There is a `refuted` rule, and its line is not so wide that the card can only win.
5. **Plain claim.** `title` and `hypothesis` state one claim in simple words, with no hype and no angle brackets.
6. **Caveats.** The card lists at least one honest limit, such as what the data does not hold (no author names, no comment text, scores as fetched).
7. **Not a copy.** No older card has the same data and groups, or nearly the same title. Search `hypotheses/` for the topic words.
8. **Right audience.** `audience` is one of `engineers`, `deep-tech investors` or `curious readers`, and fits the claim.
9. **Honor score.** After the first daily run the card gets an Honor score (docs/HONOR_SPEC.md). A low score queues an upgrade issue. It never blocks the merge.

Merge when items 1 to 8 pass. Item 9 is informational.

If a card fails item 3, say so in the PR in neutral words and ask for new lines set before the result. Do not edit the author's thresholds.
