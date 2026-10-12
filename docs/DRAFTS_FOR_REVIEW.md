# Drafts for the owner's review (nothing here is published)

Written 2026-10-13. Two pieces of text that need the owner's approval before they go on the site (docs/VOICE.md rule 8). Numbers were recomputed from data/rings.json and stories/*.json on this date. Neither draft is in any page, card or issue yet.

## 1. Beat 3 text for the home essay (#262, then Rings #276)

What the numbers allow (data/rings.json, 12 hand-picked theme groups, share of each year's story titles that name the theme, 2008 to 2025):
- Two years one apart look alike (average similarity 0.99). Five apart 0.90, ten apart 0.85, fifteen apart 0.82 (three pairs only).
- Six general-interest groups (space, games, privacy, health, history, science): 2010 against 2025 is 0.98.
- Six technology groups (Python, React, Rust, Kubernetes, LLMs, GPUs): the same comparison is 0.50. Rust, LLMs and GPUs sit near their highest share in 2025 or 2026; React peaked in 2017.
- Caveats that must stay with it: the 12 groups were chosen by hand; title words only; shares, not points, because the archive holds low points for 2023 and 2026; 2006 and 2026 are partial years.

Three options. All stay neutral on drift versus repeat.

**A (numbers first, shortest)**
> Pick 12 themes and look at each year. Two neighbouring years look almost the same. Ten years apart they still look 85% alike. Tap a year to see what moved.

**B (names what held and what moved)**
> Some themes held steady for fifteen years: space, games, privacy, health, history and science. Others came and went with their era: React peaked in 2017, Rust and LLMs are highest now. Tap any year to see its mix.

**C (asks the question, no answer)**
> Does the same community keep returning to the same things? In these 12 themes, the general-interest ones hold their share. The tools change. Tap a year and judge for yourself.

Recommendation: B. It says only what the table shows. C is the closest to the pitch but the last sentence leans on "judge for yourself", which is a flourish. Every option is followed by the existing caveat line (hand-picked themes, title words only, no points for 2023 and 2026).

Check before publishing: the claim "ten years apart 85% alike" is an average of 8 year pairs, so it belongs in A only with the Method note. B uses no averages.

## 2. Neutral wording for the card Takeaway

Where it lives: the `takeaway` field of 62 files in stories/. Today every one of the 62 uses the words "refutes" or "supports", and many open with "Yes." or "No." The owner has removed verdict labels everywhere else, and 21 cards read "Yes. The ratio is {ratio}x. It refutes the claim at {refute_at}x or less.", which is hard to follow. The rule text on the card page (the `expect` field) keeps its wording; this only changes the Takeaway line.

Proposed pattern, same placeholders, no Yes/No and no "supports/refutes":

1. Above the card's "backs it" line: `The ratio is {ratio}x. The card set its lines before the check: {support_at}x or more would back the claim, {refute_at}x or less would count against it. This is above the first line.`
2. Between the lines: same, ending `This is between the two lines.`
3. Beyond the "counts against" line: same, ending `This is past the second line.`

Today the h304 (React) template reads: "Yes. React's share is now {ratio}x of its earlier share. The card needed {support_at}x or lower to support the idea, and {refute_at}x or higher refutes it." Under the pattern it would read: "React's share is now {ratio}x of its earlier share. The card set its lines before the check: {support_at}x or lower would back the claim, {refute_at}x or higher would count against it. This is [above, between or past] the lines."

Needs from the owner: yes or no on dropping Yes/No, and whether "backs" and "counts against" are the words he wants. The three endings need a small change in the story renderer (it must know which side of the lines the ratio falls on), about 60 minutes plus a deploy, and the 62 templates are rewritten by script. The test for the 62 templates and the card story-format check in the UI test would be updated in the same change.
