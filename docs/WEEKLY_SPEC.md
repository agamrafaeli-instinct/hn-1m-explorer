# Weekly "state of HN" snapshot: spec v2

Decision (2026-10-09): scope B for all three audiences. Task #33, part of epic #32. Replaces v1, which tracked word baskets only.
Every number below was measured on the 10 saved weeks (Jul 27 to Oct 4 2026) from the archive in this repo, unless it says it came from `data/history/`.
How to read the status column: **Ship now** = computable from the archive today. **Ship with caveat** = computable, but the method is a proxy and the screen must say so. **Needs new data** = the archive cannot answer it. **Skip** = we would not publish it.

## 1. The week and what is in the file

- Monday 00:00 UTC to the next Monday 00:00 UTC, labelled by ISO week. Complete weeks only. Saved weeks are never overwritten.
- The archive keeps only the newest 1,000,000 items (about 10 weeks), so each week must be saved or it is lost.
- One file per week. The site loads one week at a time.

## 2. What the archive can and cannot tell us

These limits shape every signal below.

| Fact (measured) | Consequence |
|---|---|
| About 886k of the 1M items are comments, with full text. 114k are stories. 59 are `job` items. | Comment text is the richest source: mentions of tools, languages and companies, hiring posts. |
| About 31% of story items are dead or deleted (10,460 story items vs 7,241 live in week 2026-W31). Dead and deleted items keep no title or text. The history files in `data/history/` divide by all items, dead ones included. | A term count is the same either way, but the denominator is not. Any comparison with the history must divide by `stories_all` and `comments_all`. The snapshot stores both denominators. |
| Scores and comment counts are as first retrieved, never refreshed. 17.6k of 114k stories have a score of 1. | Points are an early reading. Use thresholds and ranks inside one week, not exact points. |
| No parent, children, rank, or user-profile fields. | We cannot link a comment to its thread, say what was on the front page, or say who is new. |
| Text is HTML and untrusted. | Match on text, render as text only. |
| `data/history/terms_daily.csv` has daily story and comment counts for 13 terms from Dec 2022 to Jul 31 2026. | Gives a baseline for 10 of them (see 3.2). The oldest point is already after ChatGPT launched. |
| A full-history archive (2006 to 2026) is being prepared separately. | May supply a pre-2022 baseline later. Not assumed here. |

## 3. Shared signals (shown on every audience screen)

### 3.1 Volume and community size. Ship now
- Question: is the site busier or quieter than last week?
- Measure: live stories, live comments, distinct authors, share of comments that are dead or deleted.
- Weekly noise: stories 6.7k to 7.3k (variation 2%), authors 21.4k to 23.1k (2%), dead comment share 8.2% to 9.4%.
- Why: a context line. A flag here only matters if it is large, since this is the denominator for everything else.
- Limit: bot and spam activity is part of dead items and cannot be separated.

### 3.2 AI share against a baseline. Ship now, with a basis note
- Question: how much of HN is about AI this week, and how far is that from where it started?
- Measure: share of stories and of comments whose title or text contains an AI word, whole words only. Core list: ai, llm, llms, chatgpt, gpt, openai, claude, copilot, anthropic, gemini. Also kept per term: ai, llm, chatgpt, gpt, openai, claude, copilot.
- This week in the saved weeks: 20% to 24% of live stories and 13% to 17% of live comments carry a core AI word (variation 5% and 8% week to week).
- Baseline: `data/history/` quarterly shares, all items counted. The word "ai" appears in 2.7% of stories in Q4 2022, 5.9% in Q2 2023, 10.3% in Q3 2025, 13.1% in Q1 2026 and 11.0% so far in Q3 2026. In comments it goes from 1.7% to 7.5%. "claude" goes from 0.0% to 2.2% of stories.
- Check done: counting whole-word matches in our archive reproduces the history counts for ai, llm, openai, claude, rust, python, remote, chatgpt and gpt within about 1% to 3% on 4 overlap days (Jul 24, 27, 29, 30). It does not reproduce crypto, layoffs and vibe_coding (the history used broader patterns). Those three are not used.
- Limit: the history has no union count, so the baseline comparison is per term. Both denominators are stored (live and all items), and the screen says which one it divides by.
- Rose or fell: the AI share is compared with the average of the previous 4 saved weeks, and with the same term in the last full history quarter.

### 3.3 Discussion intensity. Ship with caveat
- Question: where did people actually talk, and where did they argue?
- Measure: stories with 100 or more comments (2.6% to 3.0% of live stories, about 195 a week), stories with 100 or more points (3.9% to 4.6%). A "debated" list: stories with 100 or more comments and more comments than points.
- Why: points show approval, comments show effort. Both together find the stories people could not leave alone.
- Limit: comment counts are early readings. A story that blew up later is under-counted. "Debated" means more comments than points, not that people were angry. We do not call it sentiment.

### 3.4 Top stories and domains. Ship now
- Top 10 stories by points, top 15 domains, and per basket the top 3 stories and top 5 domains. Already saved in v1.

## 4. Engineers

What they bring to HN: what should I learn or use, what are people building, is AI changing how I work, and what do companies want.

| Signal | Question | How measured | Weekly size and noise | Status |
|---|---|---|---|---|
| Language mentions | Which languages are people discussing? | Whole-word mentions in story titles and comment text: rust, python, typescript, javascript, java, swift, zig, c++, kotlin. Shown as mentions per 10,000 comments plus story count. | Comments: rust 274 to 655 a week, python 257 to 664, javascript 127 to 330, typescript 30 to 417. Stories: rust 66 to 114, python 39 to 67. Variation 17% to 32% for the large ones. | Ship now for rust, python, javascript, typescript, java, swift. Zig, c++, kotlin only show when above 10 stories. |
| "Go" | Is Go rising? | The word "go" is too common to match. "golang" alone gives about 3 stories a week. | Too sparse | Skip until we agree a safe rule |
| Tools and infrastructure | What stack is under discussion? | Mentions of postgres, sqlite, docker, kubernetes, linux, git, vscode, neovim, react, wasm. | Linux is steadiest (622 to 1,070 comment mentions). Neovim and kubernetes swing over 50%. | Ship now, flag only above the size floor (see 8) |
| AI coding tools | Is AI changing how engineers work? | Mentions of claude code, cursor, mcp, copilot, agent(s), plus Claude Code and MCP as stories. | Claude Code: 60 to 98 stories and 217 to 335 comment mentions a week (variation 13% to 14%, so a real move will show). MCP 51 to 89 stories. | Ship now |
| Show HN activity | What are people building and does anyone care? | Show HN count (834 to 939 a week, about 12.5% of stories), share with 10 or more points (6.9% to 10.4%), share linking to github.com (32% to 37%), top 5 by points. | Count is steady, the 10+ points share moves 14% | Ship now |
| Ask HN volume | What are people asking? | Ask HN count and top 3 by comments. | 107 to 155 a week | Ship now |
| Hiring skills | What do employers want? | Hiring-style comments (first line has at least two "|" separated fields, as in "Company | Role | Location"), and the share naming AI/ML, Python, Rust, TypeScript, remote. | Monthly. About 187 to 207 posts in a month, around 60% name AI or ML. Weeks that do not hold a monthly thread have 7 to 60. | Ship with caveat, shown monthly (see below) |
| Discussion intensity | See 3.3. | | | Ship with caveat |
| Sentiment about AI tools | Do engineers like or dislike them? | No validated method in the repo. A word-list score would be a guess. | | Skip. A tested method plus parent links is "Needs new data" |

Hiring caveat: the monthly "Who is hiring" thread is not linked to its comments (no parent field), and the thread spills across two calendar weeks (169 and 63 posts in 2026-W40 and 2026-W41). The match also picks up a few non-hiring comments that use "|". So hiring is reported per month, labelled "estimated", never as an exact count.

## 5. Deep-tech VCs

What they bring to HN: which hard-tech areas are getting attention, which companies and products keep coming up, where is money moving, is AI absorbing everything.

| Signal | Question | How measured | Weekly size and noise | Status |
|---|---|---|---|---|
| Deep-tech themes | Which areas are rising? | Split the existing deeptech word list (`scripts/terms.py`) into themes: quantum; fusion and fission; chips (semiconductor, risc-v, lithography, fpga, asic); batteries and solid-state; bio (crispr, mrna, gene editing, synthetic biology); photonics and lidar. Plus the history baskets data center, gpu, robotics, solar. | The whole basket is 49 to 73 stories a week, so each theme is about 5 to 20. | Ship with caveat: themes below 8 stories a week show only as "present" or "absent", never rose or fell |
| Company watchlist | Which companies keep coming up? | A fixed list of names chosen by the project owner. Mentions in story titles, whole word, case rules for common words (Meta, Apple, Amazon, Intel). | OpenAI 58 to 130 a week, Google 61 to 97, Apple 52 to 91, Anthropic 44 to 103, Nvidia 11 to 79, Meta 20 to 83. Small names (Rocket Lab, Anduril, TSMC, Mistral) sit near 0 to 8. | Ship now for the list, but small names can only show appear or not |
| Auto-found names | Which new names appear? | Capitalised words in titles. A test on 2026-W40 returned "RSS", "Tiny", "Dots", "Won", "Car" next to "Elon Musk" and "Sonnet". | Too noisy | Skip. A reviewed list is the safe path |
| Deal words | Where is money moving? | Titles with raises, series A to E, seed round, funding, acquires, acquisition, IPO, valuation, bankrupt, layoffs, shuts down. | 42 to 78 titles a week (variation 15%) | Ship with caveat: this is HN talking about deals, not a deal database |
| Press vs primary source | Is the talk about news or about the work? | Share of stories from press domains (techcrunch, bloomberg, reuters, wsj, ft, nytimes, economist and similar) vs primary domains (arxiv, nature, science.org, github, company blogs). The two lists are a code change to edit. | Press 8.2% to 10.2%, primary 11.7% to 13.2% | Ship with caveat: list choice is a judgment call |
| AI infrastructure vs AI apps | Is the AI wave about chips and power or about apps? | Share of stories with gpu, nvidia, data center, tpu words against stories with agent, app, tool words. | Not measured yet | Ship with caveat once the word lists are agreed |
| Hiring in deep tech | Are hard-tech firms hiring? | Same hiring-style comments as in section 4, filtered for theme words. | Too few per month | Skip |
| Funding amounts, valuations | How much money? | Not in the archive. | | Needs new data (and an outside source) |

Standing caveat from the VC history work: matches on words do not tell us about company ownership, funding, capability or contact details. The page says "mentioned", never "raised" or "owns".

## 6. Curious geeks

What they bring to HN: show me something odd, old or delightful that is not about AI or software, and tell me what is different this week.

| Signal | Question | How measured | Weekly size and noise | Status |
|---|---|---|---|---|
| Topic baskets | What kinds of curiosity are up? | The 6 geeks baskets (weird, science, retro, history, puzzle, boring) and the 15 round 2 topics (space, animals, food, music, health, climate, privacy, education, games, books, art, maps, languages, diy, questions). | 9 to 496 stories a week each | Ship now (v1) |
| AI-free share | Is there anything on HN besides AI? | Share of live stories with no AI word (about 76% to 80%), and the top 5 non-AI stories. | Variation 5% | Ship now |
| Old things | Are people digging up old pieces? | Share of titles ending in a year in brackets, for example "(2012)". HN uses this tag for older posts. | 1.7% to 2.8% (about 120 to 190 stories). Variation 15% | Ship now |
| Variety of sources | Is the front of HN one-note? | Distinct domains per 100 linked stories (50.2 to 52.1) and share of linked stories from the top 10 domains (21.7% to 23.5%). | Very steady (variation 1% to 2%) | Ship now, as a slow-moving measure, flagged only on large moves |
| Reading and watching | Long reads, video, reference? | Share of stories from youtube.com, en.wikipedia.org, and a short list of long-read sites. | Not measured yet | Ship with caveat: the long-read list is a judgment call |
| Most debated non-AI story | What got people going? | Top debated story (see 3.3) outside the AI list. | One a week | Ship with caveat |
| Questions people ask | What are people curious about? | Top 5 Ask HN by comments. | | Ship now |
| Mood or tone | Is it friendly this week? | No validated method. | | Skip. Needs new data and a tested method |

## 7. Rose, fell and new

One rule for counts, one for shares, one for new names.

**Counts of stories or comments (baskets, languages, tools, themes, companies):**
- expected = last week's share x this week's total
- difference = this week's count minus expected
- Flag when the difference is at least 8 and at least 3 times the square root of expected. Positive means rose, negative means fell.
- Size floor: if expected is below 8 and the count is below 8, the item is not rated. Show "too small to tell".
- Why this size: on the 9 week-to-week changes, a 2 standard error rule flagged 45 of 225 basket-weeks (about 5 a week, mostly noise). 3 standard errors with the floor flagged 16 (about 2 a week).

**Shares and rates (AI share, dead share, Show HN quality, press share, variety):**
- Flag when the share moves by more than 3 times its usual week-to-week change. The usual change is the standard deviation of the last saved weeks, with at least 4 weeks needed. Until 4 weeks exist, no flag.
- Always show the 4-week average beside this week.

**New:**
- A domain with at least 5 stories this week and at most 2 last week. The snapshot keeps every domain with 3 or more stories so this is checkable. 0 to 3 a week.
- A watchlist name with 0 mentions for 4 weeks that now has 3 or more.

**Per screen:** up to 3 rose, 3 fell, 5 new, then top stories. A week with no flags says "no big changes".

## 8. Needs new data (not in the archive)

| Need | Why | How we could get it |
|---|---|---|
| Comment parent and thread ids | Link hiring posts to their thread, measure real thread depth and size, tell a pile-on from a conversation | HN API item fields `parent` and `kids` (public) |
| Front page rank over time | "Spent N hours on the front page" is the real attention measure | An hourly job reading HN's top stories list and saving the ids. Starts a new history from the day it runs |
| Later scores | Today's scores are first readings | Re-fetch each story once, 3 days after it is posted |
| Pre-2022 and full-history baseline | Compare AI against the time before ChatGPT | The full-history archive now being built, or the public Algolia HN search API |
| Newcomers | Is the community growing? | User created date from the HN API |
| Sentiment | Tone of discussion | A tested method with a small hand-labelled sample. Not assumed |
| Money amounts and company facts | Funding, valuation | Outside the archive. Not HN data |

## 9. What the file stores (schema v2, built)

Everything in v1 (totals, baskets, top stories and domains, every domain with 3 or more stories; the only v1 change is that `job` items are counted apart from `other`), plus:
- `shared`: `volume` (live and all stories and comments, distinct authors), `ai.terms` (core union and 10 baseline terms, four counts each: story_live, story_all, comment_live, comment_all), `discussion` (stories with 100+ comments or points, debated top 10, most commented top 10).
- `engineers`: `languages` (9), `tools` (10), `ai_coding` (6), `show_hn`, `ask_hn`, `hiring` (estimated posts, 7 skills, job items).
- `vcs`: `themes` (10), `ai_infra`, `sources` (press and primary), `watchlist` (27 starter names, owner list to replace it), `deal_words` (9 groups plus top 5 titles).
- `geeks`: `ai_free`, `old_year_tag`, `variety`, `reading` (youtube, wikipedia), `debated_non_ai`.
- `methods`: list version. The word lists are in `scripts/weekly_lists.py`. A new list version means a new code change and test.
Size: about 53 KB a week.
The per-audience scope decides what each screen shows. All the signals above are stored for every week now, so any pick works on all 10 backfilled weeks.

**Backfill:** the 10 files are rebuilt as v2 on Oct 9 (kind "backfill"). `--backfill --replace-backfill` replaces only backfill files with an older schema, never a file saved by the weekly job. Week 2026-W31 can only be rebuilt until about Oct 12.

## 10. Not claimed

- Rose or fell is about how many stories or comments carry the words, not about interest, opinion or quality.
- A flag points at something to look at. It is not a finding. Findings belong to the Headliner epic.
- Word matches include other meanings (for example "rust" the game, "cursor" the word).
- The page never says a company raised money, owns something, or is hiring because of a match.
