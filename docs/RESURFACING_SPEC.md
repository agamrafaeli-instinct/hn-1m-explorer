# Resurfacing: when forgotten things return

Epic #285 (Phoenix). Spec for #286. Status: rules are fixed before any run. No result is claimed here.

## Question
When a subject goes quiet on Hacker News and then comes back, what does the return look like, how long was the quiet spell, and what came before it? Which subjects never go quiet? Single comebacks are evidence inside the pattern, not the product. Conclusions are written only after the data is seen (owner decision, 2026-10-12), and the owner approves the text.

## Unit
A **subject** is one of two things, analysed separately:
1. **Term**: a word or word group in story titles. Source: data/atlas/terms-a.json to terms-z.json (monthly story counts per term, 2006-10 to 2026-08, from titles in data/archive) and the 52 chosen groups in data/film_shares.json (monthly stories and points).
2. **Domain**: a site in story urls. Source: data/atlas/tops-YYYY.json, `top_domains` per month, as [domain, count].

The unit of time is the UTC month. The newest partial month is dropped.

## Rules (thresholds fixed before the run)
Let `c(m)` be a subject's story count in month `m`, and `t(m)` all live stories that month. Work with the share `s(m) = c(m) / t(m)` so growth of the site does not hide a return. Use the 12-month trailing mean of the share, `b(m)`.

**Eligible subjects.** At least 60 stories in total over the archive, and at least 12 months with 3 or more stories. Smaller subjects are too thin to tell quiet from noise.

**Active level.** A subject's active level `A` is the median share over its months with `s(m) >= 0.5 x peak year share`, where peak year share is the best calendar year.

**Quiet spell.** A run of at least 12 consecutive months where `s(m) < 0.2 x A` each month, and the run follows at least 12 active months (months with `s(m) >= 0.5 x A`). Shorter dips are not counted.

**Return.** The first month after a quiet spell where `s(m) >= 0.5 x A` for 3 months in a row. The return month is the first of those 3. A single spike month does not count.

**Burial length.** Months from the start of the quiet spell to the return month.

**Never quiet.** Eligible subjects with no quiet spell under these rules over their whole life. Subjects younger than 36 months are listed apart, since they cannot show a 12-month spell after 12 active months.

## What came before a return
For each return, record what happened in the 3 months before the return month. Each is a plain, checkable label, set from data:
- **Anniversary**: the return month falls within 1 month of a calendar anniversary of the subject's own first peak month (a multiple of 12 months, plus or minus 1). Test against a shuffled baseline (same number of returns, random months) so a chance match rate is known.
- **Neighbour**: a related subject (same term group in data/film_shares.json or a shared domain) rose past `0.5 x` its own `A` in the 3 months before the return.
- **Outside event**: only if the story that led the return month is tied to a dated source (a release, a law, an outage) in its title or url. Not inferred from the data alone. Counted separately and kept small.
- **None found**: no label fits. This is shown, not hidden.

## Grouping by shape
Shapes are set by rule on the share curve from the quiet spell start to 24 months after the return:
- **Sharp**: the return month share is at least `1.0 x A` and the next 3 months stay at or above `0.5 x A`.
- **Slow**: share climbs for 6 or more months before it reaches `0.5 x A`.
- **Short**: back below `0.2 x A` within 12 months of the return.

Groups with fewer than 10 returns are merged into "other" and flagged as small.

## What would count as no pattern
Written down now so the data cannot move it:
- Fewer than 30 returns across all eligible subjects.
- The anniversary match rate is within the 5th to 95th percentile of the shuffled baseline (1,000 shuffles).
- No shape holds more than 40% of returns, and burial lengths show no peak: the middle 50% of lengths spans more than 5 years.
In that case the page says there is no clear pattern and shows the data.

## Data gaps
- Terms are title words, not topics. A topic with changing vocabulary looks quiet when it is not.
- Domain data holds only the top domains per month, so a domain falls out of view when it is small. A domain "returning" can mean it re-entered the top list. Domain results carry this caveat, and the term analysis leads.
- Points are low in the archive for 2023 and 2026, so the analysis uses story counts and shares, not points.
- Recent subjects (young) have no room for a 12 + 12 month history. They are listed apart.
- Dead and deleted stories keep no title, so shares divide by live stories.
- The newest months can change as scores settle. The last partial month is dropped.

## Outputs (for #287 to #290)
- A table of quiet spells and returns per subject: start, return month, burial length, shape, before-label.
- The list of never-quiet subjects.
- Summary numbers: count of returns, median and quartiles of burial length, label shares with the shuffled baseline.
- Each number carries a source line (file and field) and the 2023 and 2026 points caveat.
- No conclusion text until the owner has seen the numbers.
