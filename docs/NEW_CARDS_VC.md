# New definitions for the 5 Deep-tech investor cards

Spec for review. No ratio or verdict was computed for any card here. Term counts on the newest-1M archive were looked at only to draw samples for the false-match check. No card file was added or edited. Old cards h115 to h119 stay as they are, and their verdicts are not carried over. Issue #58, epic #40.

The shared rules (population, title-only matching, window kinds, minimum counts, the threshold families, confidence labels, the sample check method and the limit on adoption claims) are the same as in [NEW_CARDS_ENGINEERS.md](NEW_CARDS_ENGINEERS.md). They are restated on each card where they matter.

Words with other meanings, and the rule that handles each:
- **robots.txt and Robot Framework** (software, not machines): excluded in the robotics pattern.
- **solar eclipse, solar system, solar flare, solar storm, solar wind, solar cycle, solar sail, solar orbit** (astronomy): excluded in the solar pattern.
- **robot as a bot** (chat bots, scripts): not separable by pattern; listed as a caveat on h171.
- **GPU in games and graphics**: not separable by pattern; listed as a caveat on h170.
- **data centre** (British spelling): matched together with data center.

## h169: Are data centers coming up more in story titles?

- **Replaces:** h115. The old verdict is not carried over.
- **Audience:** deep-tech investors
- **Question:** Are data centers coming up more in story titles?
- **Terms:** `\bdata cent(er|re)s?\b` (case-insensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Share of live stories that match, monthly mean, later divided by earlier.
- **Thresholds (set before any run):** Supported (strong) at ratio 1.25 or more. Supported (weak) at 1.10 or more. Refuted at 1.00 or less. Anything else, inconclusive.
- **Control:** Drift control: the share of live stories whose title has a question word (`\b(how|why|what)\b`, case-insensitive). If its later/earlier ratio is outside 0.85 to 1.15, the card is inconclusive and says title style moved.
- **Minimum count:** each window needs at least 150 matching stories (30 over the whole window for the points card). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - Counts titles about data centers, including local news and policy. It does not measure data center building or investment.
  - Old card h115 matched title plus text and used the first and last six months of Jan 2023 to Jun 2026. This card uses title only and 12-month windows.
  - HN attention is not technical validation, adoption, revenue or investment return.
- **Sample check:** 20 titles drawn from the newest-1M archive; 0 of 20 did not match the intended meaning.

## h170: Are GPUs coming up more in story titles?

- **Replaces:** h116. The old verdict is not carried over.
- **Audience:** deep-tech investors
- **Question:** Are GPUs coming up more in story titles?
- **Terms:** `\bgpus?\b|\bcuda\b` (case-insensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Share of live stories that match, monthly mean, later divided by earlier.
- **Thresholds (set before any run):** Supported (strong) at ratio 1.25 or more. Supported (weak) at 1.10 or more. Refuted at 1.00 or less. Anything else, inconclusive.
- **Control:** Drift control: the share of live stories whose title has a question word (`\b(how|why|what)\b`, case-insensitive). If its later/earlier ratio is outside 0.85 to 1.15, the card is inconclusive and says title style moved.
- **Minimum count:** each window needs at least 150 matching stories (30 over the whole window for the points card). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - Nvidia and other company names are left out on purpose, so stock and earnings stories do not count.
  - Graphics and gaming GPU stories count the same as AI GPU stories.
  - HN attention is not technical validation, adoption, revenue or investment return.
- **Sample check:** 20 titles drawn from the newest-1M archive; 0 of 20 did not match the intended meaning.

## h171: Does robotics keep its share of story titles?

- **Replaces:** h117. The old verdict is not carried over.
- **Audience:** deep-tech investors
- **Question:** Does robotics keep its share of story titles?
- **Terms:** `\brobotics\b|\brobots?\b(?!\.txt|\s+framework)|\bhumanoids?\b` (case-insensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Share of live stories that match, monthly mean, later divided by earlier.
- **Thresholds (set before any run):** Supported (strong) at ratio 1.00 or more. Supported (weak) at 0.90 or more. Refuted at 0.75 or less. Anything else, inconclusive.
- **Control:** Drift control: the share of live stories whose title has a question word (`\b(how|why|what)\b`, case-insensitive). If its later/earlier ratio is outside 0.85 to 1.15, the card is inconclusive and says title style moved.
- **Minimum count:** each window needs at least 150 matching stories (30 over the whole window for the points card). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - "robots.txt" and "Robot Framework" are excluded; both are software.
  - "Robot" is still used as a metaphor and as a product name (2 of 20 sampled titles). It is a broad word proxy, not physical-robot adoption.
  - "Keep" means at least 90 percent of the earlier share. Old card h117 used a long-run first/last six-month window.
  - HN attention is not technical validation, adoption, revenue or investment return.
- **Sample check:** 20 titles drawn from the newest-1M archive; 2 of 20 did not match the intended meaning.

## h172: Is solar energy coming up more in story titles?

- **Replaces:** h118. The old verdict is not carried over.
- **Audience:** deep-tech investors
- **Question:** Is solar energy coming up more in story titles?
- **Terms:** `\bphotovoltaics?\b|\bsolar\b(?!\s+(eclipse|system|flares?|storms?|wind|cycle|sail|orbit))` (case-insensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Share of live stories that match, monthly mean, later divided by earlier.
- **Thresholds (set before any run):** Supported (strong) at ratio 1.25 or more. Supported (weak) at 1.10 or more. Refuted at 1.00 or less. Anything else, inconclusive.
- **Control:** Drift control: the share of live stories whose title has a question word (`\b(how|why|what)\b`, case-insensitive). If its later/earlier ratio is outside 0.85 to 1.15, the card is inconclusive and says title style moved.
- **Minimum count:** each window needs at least 150 matching stories (30 over the whole window for the points card). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - Eclipse, solar system, flares, storms, wind, cycle, sail and orbit are excluded, which old card h118 could not do (it had a combined count with astronomy). Solar-powered consumer products still match (1 of 20 sampled titles).
  - Old card h118 is a solar-matches card that included eclipses.
  - HN attention is not technical validation, adoption, revenue or investment return.
- **Sample check:** 20 titles drawn from the newest-1M archive; 1 of 20 did not match the intended meaning.

## h173: Do data center stories keep a points premium once the biggest hits are dropped?

- **Replaces:** h119. The old verdict is not carried over.
- **Audience:** deep-tech investors
- **Question:** Do data center stories keep a points premium once the biggest hits are dropped?
- **Terms:** `\bdata cent(er|re)s?\b` (same terms as h169)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** For each month, drop the top 1 percent of live stories by score on each side (data center stories, and all other live stories). Divide the data center side's points per remaining story by the other side's. Take the later-window mean of that monthly ratio.
- **Thresholds (set before any run):** Supported (strong) at ratio 1.30 or more. Supported (weak) at 1.10 or more. Refuted at 0.90 or less. Anything else, inconclusive.
- **Control:** Built in: the comparison group is all other live stories in the same month.
- **Minimum count:** each window needs at least 150 matching stories (30 over the whole window for the points card). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - Points are snapshots taken when the data was collected. For months in the long-run window, the data agent states how old each snapshot was.
  - Sensitive to which stories are the hits. This card is the hit-robust version of the data center share and does not test share.
  - Few stories per month in the earlier window may make the trimmed group small; the minimum count rule (30 matching stories over the window) applies.
  - HN attention is not technical validation, adoption, revenue or investment return.
- **Sample check:** 20 titles drawn from the newest-1M archive; 0 of 20 did not match the intended meaning.

## New card IDs

The Engineers cards use h150 to h168. These five continue from h169.

| New ID | Replaces | Question |
|---|---|---|
| h169 | h115 | Are data centers coming up more in story titles? |
| h170 | h116 | Are GPUs coming up more in story titles? |
| h171 | h117 | Does robotics keep its share of story titles? |
| h172 | h118 | Is solar energy coming up more in story titles? |
| h173 | h119 | Do data center stories keep a points premium once the biggest hits are dropped? |
