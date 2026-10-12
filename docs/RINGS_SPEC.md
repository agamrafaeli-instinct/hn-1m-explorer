# Rings: what HN rewarded, year by year

Epic #272. Spec for #273. Status: plan for the build; no result is claimed here.

## Question
For each year from 2006 to now, what did the community reward: which themes, which domains, which story types? The view shows the same thing for every year so the reader can compare them. It does not say whether taste drifts or repeats. The data answers that after the view is built (owner decision, 2026-10-12).

## Wording rules
- Headings, labels and intro copy are neutral. No "taste never changes", no "taste has shifted".
- The beat 3 text in the essay (#262) and any written finding (#277) come after the view is live and the owner has seen the data. The owner approves the text.
- If the data shows drift, docs/NARRATIVE.md is updated to match.
- Say "points", not "votes". Scores for 2025 and 2026 are low, so those years are shown as shares and ratios. Say so on the page.

## Series and sources
| Series | Source | Unit per year | Gap |
|---|---|---|---|
| Themes | data/film_shares.json, monthly, the term groups (react, rust, sql, cu_*, gk_* and others) with `_s` (stories) and `_p` (points) | share of stories and points per story, summed by year | Covers about 60 chosen term groups, not every topic. A year view needs a fixed list of groups to compare; pick it from `terms` and state it on the page. |
| Domains | data/atlas/tops-YYYY.json, per month `top_domains` as [domain, count] | top domains per year, counts summed over months | Counts, not points. Points per domain need data/atlas or the archive; decide in #274 whether counts are enough. |
| Story types | data/atlas/concentration.json `type`, and data/atlas/months.json (stories, comments, jobs, polls) | share of items by type per year | Show HN, Ask HN and similar need a title-prefix count; check whether `gk_showhn_s` and `cu_questions_s` in film_shares cover it. |
| Top stories | data/atlas/tops-YYYY.json `top_stories` | the highest-scoring stories of the year | Points for 2025 and 2026 are low; label as such. |

## Layout
- Mobile first at 390 px. One year per row or band, oldest first, scrolling down. Labels on line ends, no legend.
- Three bands per year: themes, domains, story types. The same fixed lists every year.
- The year range control from yearzoom.js (#/explore) is reused for the standalone page.
- One component, two mounts: the standalone page `#/rings` (#275) and the essay beat 3 (#276).

## What each number must carry
A source line (file and field), the unit, and the 2025 and 2026 caveat.

## Open points for #274
- Which fixed list of theme groups (start from film_shares `terms`).
- Whether domain counts are enough or points per domain are needed.
- Whether story types come from the existing fields or need a new aggregate (a new aggregate is a separate small ticket).

## Done when
Every series above has a named source file and field, the gaps have a decided fix, and the owner has seen this plan before #274 starts.
