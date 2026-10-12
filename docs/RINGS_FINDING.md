# Rings: what the first numbers show

Draft for the owner (epic Rings #272, task #277). Written after the view was live (#/rings). It reports numbers and does not change the pitch until the owner decides.

## How it was measured
- Source: data/rings.json (built from data/film_shares.json). 12 theme groups, share of each year's story titles that name the theme, each scaled to the theme's own highest year.
- Each year is a 12-number profile. Two years are compared with cosine similarity: 1.0 means the same profile, lower means a different mix.
- Years 2008 to 2025 only (2006 and 2026 are partial).

## What the numbers show
- Average similarity between two years falls as the gap grows: 1 year apart 0.99, 2 years 0.97, 5 years 0.90, 10 years 0.85, 15 years 0.82 (3 pairs only for 15).
- Split the 12 groups in two. Six general-interest groups (space, games, privacy, health, history, science): 2010 against 2025 is 0.98. Six technology groups (Python, React, Rust, Kubernetes, LLMs, GPUs): the same comparison is far lower (Python alone 0.50; React, Rust, Kubernetes and LLMs were near zero in 2010).
- Domains: the top five of each year share two to four names across a decade (nytimes.com and youtube.com appear in both 2010 and 2025). github.com and medium.com enter in the middle years.

## Reading, without a verdict
In this sample, general-interest themes hold a similar share for fifteen years, and technology themes come and go with their era. Whether that supports "the taste stays the same" depends on which themes count as taste. The data does not settle it.

## Caveats
- The 12 groups were chosen by hand, and a different list could give a different picture.
- Title words only: a story about a theme that never names it is missed.
- Domains are counts of monthly top-list appearances, not points.
- Scores for 2025 and 2026 are low, so points are not used here.

## For the owner
No change to docs/NARRATIVE.md has been made. Options: keep the pitch as is, soften "the taste doesn't" to name what held (general-interest themes) and what moved (tools), or run a wider theme list first.
