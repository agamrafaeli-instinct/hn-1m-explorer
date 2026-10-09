# Throughline: audit and six pilot rewrites

Proposal only. No card, threshold or verdict changes. Every number below was computed on 2026-10-09 from the card files with `hyp-eval.js` and the source data files. Wording is a draft for review.

## Audit of the 80 current cards
Verdicts today: 43 supported, 19 refuted, 18 inconclusive. Audiences: 20 engineers, 21 deep-tech investors, 31 curious readers, 8 untagged. Sources: summary.json 11, engineers_history.json 19, vcs_deeper.json 15, vcs_history.json 5, geeks.json 15, curious_round2.json 15.

Recurring problems, with counts from the files:
1. **Title reads as a finding.** All 80 titles state the proposition or a topic (for example "React's grip is loosening" is refuted; "Java is dying on HN" is inconclusive). 37 titles sit on refuted or inconclusive cards.
2. **"What we saw" gives two means and a ratio, with no reason to care.** No card has a field for why the comparison matters; 0 of 80 cards carry `why`.
3. **The main limit is folded away.** Caveats render only inside the details block. Every card has at least one.
4. **"Rules set in advance" is generic.** 30 cards carry exploratory wording in their caveats or rules (thresholds saved after earlier summaries were seen), yet the renderer prints one fixed label.
5. **"Full archive" wording hides coverage.** The engineers and history cards say "full archive" for data that starts in Jan 2023 and ends Jun 2026 (complete months, keyword baskets). It is not the whole HN archive. The original test window and the historical strip are shown side by side without saying they differ.
6. **Title or text matches read as adoption.** Cards on languages, tools and topics count stories whose title or text matches words. This must never be written as use, adoption or demand.
7. **Verdict and headline can disagree after a refresh.** Copy is static; only numbers are computed.

## Presentation layer (protects the evidence)
- Frozen cards (h012-h030, h115-h119) stay byte-identical. Story copy lives in a separate file per card, `stories/<id>.json`, keyed by card ID and the verdict it was written for.
- Every number in a story comes from a placeholder filled by the evaluator or the source file (`{a}`, `{b}`, `{ratio}`, `{n_a}`, `{window}`). No typed numbers.
- Each story declares `for_verdict`. If the computed verdict differs, or a placeholder is missing, the renderer falls back to the current card text, plus a neutral line "This story needs review after the latest refresh."
- The original proposition stays visible as "Tested proposition", separate from the finding line.
- Rule line is per card: "Thresholds set before the test" only when the card says so; "Thresholds saved after earlier summaries were seen (exploratory)" for the 30 flagged cards; otherwise "Thresholds as declared on the card".
- Coverage line is generated from the data file window or data/manifest.json. "Full archive" is removed.
- Nothing claims preregistration, cause, motive or statistical confidence. Confidence labels stay "declared thresholds".

## Pilots
Layout for all six: question, why care, chart with the key comparison annotated (two bars or two lines with the values on them, a bracket labelled with the ratio), takeaway, boundary line, explore further, details folded.

### 1. h013, engineers, supported (strong)
- Source: data/engineers_history.json, `monthly`, fields agents_s, chatbot_s. Windows: Jan to Jun 2023 vs Jan to Jun 2026.
- Problem: title says "moved" as a fact; the card shows 0.06 vs 6.8 and a 111x ratio, which is huge only because the start is near zero; that limit is hidden.
- Question: Did HN stories shift from chatbots to agents?
- Why care: it shows when AI talk on HN changed from one product name to a way of building.
- Opening: In Jan to Jun 2023, 439 stories matched "agent" or "agents" and 7,866 matched "ChatGPT" or "GPT". In Jan to Jun 2026 it was 15,886 and 2,383.
- Takeaway: Agent stories went from 0.06 to 6.8 per chatbot story, so the answer is yes by the card's rule (3x or more).
- Visible caveat: "Agent" also matches secret agent and user agent, and the 2023 base is small, so read the direction, not the size. Matches show wording in stories, not what developers use.
- Chart annotation: two paired bars per period (agent, chatbot) with counts on top; bracket across the periods "0.06 to 6.8 per chatbot story".
- Explore further: h012 (TypeScript vs JavaScript).

### 2. h016, engineers, refuted (strong)
- Source: same file, fields react_s, s_total.
- Problem: the title "React's grip is loosening" reads like a finding but the result is the opposite.
- Question: Is React losing ground on HN?
- Why care: React is the default front-end name; a fall would mean attention moved on.
- Opening: React appeared in 0.35% of stories in Jan to Jun 2023 (701 of 202,339) and 0.45% in Jan to Jun 2026 (1,181 of 260,126).
- Takeaway: No. React's share rose 1.31x. The card needed 0.85x or lower to support the idea, and 1.1x or higher refutes it.
- Visible caveat: "React" also matches the verb, and a story that names React is not proof anyone uses it.
- Chart annotation: two bars, 0.35% and 0.45%, arrow labelled "up 1.31x"; a dashed line at the 0.85x level marked "needed to support".
- Explore further: h012, the Java card h030.

### 3. h121, curious readers, supported (strong)
- Source: data/geeks.json, basket weird, fields t_points, t_stories, t_rest_points, t_rest_stories. Window: newest items, about 10 complete weeks to Oct 4 2026 (data range Jul 23 to Oct 9 2026).
- Problem: title is hard to parse; the result is a robustness test but is not framed as one.
- Question: Do weird stories still win when the biggest hits are removed?
- Why care: a few viral posts can fake a lead. Dropping the top 1 percent tests that.
- Opening: With the top 1 percent of stories by score removed on both sides, 478 weird-word stories averaged 21.5 points and 69,389 other stories averaged 12.2.
- Takeaway: The lead survives: 1.77x, above the 1.3x bar.
- Visible caveat: "Weird" is a fixed word list matched on titles, not a measure of weirdness. Scores are snapshots and the latest days are immature.
- Chart annotation: two bars 21.5 vs 12.2 with a faded ghost bar for the untrimmed values, labelled "before trimming".
- Historical context: none. Show the untrimmed result from the parent card as a link only.
- Explore further: the parent weird-words card, h126.

### 4. h138, curious readers, refuted (weak)
- Source: data/curious_round2.json, series.music, fields comments, comment_stories, rest_comments, rest_comment_stories. Window: 10 complete weeks, Jul 27 to Oct 4 2026.
- Problem: title "Music starts more conversations" is a claim; the data say the reverse. Card caveat says exploratory, but the renderer says "set in advance".
- Question: Do music stories get more comments than other stories?
- Why care: it tests a common guess, that creative topics draw more talk.
- Opening: Across 10 weeks, 379 music-title stories with known comment counts averaged 6.8 comments. 70,191 other stories averaged 10.2.
- Takeaway: No. Music averaged 0.69x the comments of other stories (weekly average ratio). The card refuted at 1.0x or below.
- Visible caveat: Thresholds were saved after earlier summaries were seen, so this is exploratory. Title match only; scores and comments are snapshots.
- Chart annotation: two bars 6.8 vs 10.2 with the ratio bracket; small dot row for the 10 weekly ratios.
- Explore further: h137, h139.

### 5. h105, deep-tech investors, refuted (strong)
- Source: data/vcs_deeper.json, `weekly`, fields neurobio_points, neurobio_stories and the rest. Topic found in weeks 1 to 5 (Jul 27 to Aug 24 2026), tested on weeks 6 to 10 (Aug 31 to Sep 28 2026).
- Problem: the topic was found in the first five weeks, so a premium was expected, but the title still reads as a claim; the discovery step is only in details.
- Question: Did neural biology keep an attention premium after it was spotted?
- Why care: topics chosen from past data often fade; this checks whether this one held.
- Opening: In the first five weeks, neural biology stories averaged 10.6 points (446 over 42 stories) against 18.8 for the rest. In the next five weeks, 3.1 points (69 over 22 stories) against 18.6.
- Takeaway: No premium. In the test weeks it earned 0.17x the points per story of other stories. The card refuted at 0.9x or below.
- Visible caveat: The topic was picked from the first five weeks (exploratory), and 22 stories is a small sample. HN attention is not technical validation or an investment signal.
- Chart annotation: four bars in two pairs, "Found in" and "Tested in", ratio bracket on the second pair.
- Explore further: h104, h111.

### 6. h100, deep-tech investors, inconclusive
- Source: same file, fields datacenters_stories, total_stories. Same windows.
- Problem: "attention persists" reads as a finding. The result is in the gap between the support and refute thresholds, and the page does not say what that means.
- Question: Is HN still writing about data centers and the grid at the same rate?
- Why care: power and compute are central themes for deep-tech readers.
- Opening: Data center and grid titles were 0.96% of stories in Jul 27 to Aug 24 2026 (341 of 35,429) and 0.66% in Aug 31 to Sep 28 (231 of 35,142).
- Takeaway: Not settled. Mentions fell to 0.68x of the earlier share. That is above the 0.5x level that refutes and below the 0.8x level that supports.
- Visible caveat: Five weeks per side; the weekly share ranged from 0.50% to 1.30%, so the gap sits inside the swing. Title matching only.
- Chart annotation: the ten weekly shares as a line, the two five-week averages as flat segments, and a shaded band for "between the thresholds".
- Explore further: h108, h104.

Coverage of audiences and outcomes: engineers (supported, refuted), curious readers (supported, refuted), deep-tech investors (refuted, inconclusive).

## Date and coverage rules
- Original test window and historical context are labelled separately ("Tested: Jul 27 to Oct 4 2026. Context: Jan 2023 to Jun 2026, monthly keyword counts, not the full HN archive").
- Historical context is a second chart under the takeaway. It never changes the number that decides the verdict.
