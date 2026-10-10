# New definitions for the 19 Engineers cards

Spec for review. No ratio or verdict was computed for any card here. Term counts on the newest-1M archive were looked at only to draw samples for the false-match check. No card file was added or edited. Old cards h012 to h030 stay as they are, and their verdicts are not carried over. Issue #57, epic #40.

## Rules shared by all 19 cards
- **Population.** Live stories only (not dead, not deleted). Comments are used only where a card says so.
- **Matching.** Title only, whole words, case-insensitive unless the pattern says otherwise. The old cards matched title plus text. For Show HN stories, the text often repeats words that have nothing to do with the topic, so this spec uses the title.
- **Windows.** Two kinds, written on each card. Long-run cards compare the latest 12 complete months with the same 12 calendar months 3 years earlier, using the full monthly record (decision on #59). Short-run cards use the 10 complete weeks in this repo's archive.
- **Minimum count.** Each window needs at least 150 matching stories for share cards, and at least 30 for points cards over the whole window. With fewer, the verdict is inconclusive with the reason "too few matches".
- **Thresholds are written here, before any run**, in the families below. The ratio is later divided by earlier.
  - Rise: supported (strong) at 1.25 or more, supported (weak) at 1.10 or more, refuted at 1.00 or less, otherwise inconclusive.
  - Fall: supported (strong) at 0.80 or less, supported (weak) at 0.90 or less, refuted at 1.00 or more, otherwise inconclusive.
  - Hold: supported (strong) at 1.00 or more, supported (weak) at 0.90 or more, refuted at 0.75 or less, otherwise inconclusive.
  - Points premium: supported (strong) at 1.30 or more, supported (weak) at 1.10 or more, refuted at 0.90 or less, otherwise inconclusive.
- **Confidence labels** are the declared thresholds, not statistical intervals. No card claims significance, cause or preregistration. The thresholds were written before the first run of these cards, but after earlier cards on similar topics had been seen, so the cards are exploratory.
- **Matches are not adoption.** A title that names a tool shows what people wrote about, not what engineers use.
- **Sample check.** For each term list, 20 live-story titles were drawn at random (fixed seed) from the newest-1M archive (Jul 23 to Oct 9 2026) and read by hand. The count of titles that did not match the intended meaning is on each card. Titles from the earlier windows were not checked; the data agent should repeat the 20-title check on the earlier window before the first run and record the result in the card.

## h150: Is TypeScript taking over from JavaScript in story titles?
- **Replaces:** h012. The old verdict is not carried over.
- **Audience:** engineers
- **Question:** Is TypeScript taking over from JavaScript in story titles?
- **Terms, side A:** `\btypescript\b` (case-insensitive)
- **Terms, side B:** `\bjavascript\b` (case-insensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Share of TypeScript-or-JavaScript stories that name TypeScript: TS / (TS + JS), mean of monthly values, later window divided by earlier window.
- **Thresholds (set before any run):** Supported (strong) at ratio 1.25 or more. Supported (weak) at 1.10 or more. Refuted at 1.00 or less. Anything else, inconclusive.
- **Control:** Built into the pair: the denominator is the TS + JS stories, so a general change in how many stories mention languages does not move it.
- **Minimum count:** each window needs at least 150 matching stories (30 for the points cards, over the whole window). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - A title that names both counts on both sides.
  - Naming a language in a title is not using it.
  - Old card h012 used the ratio TS per JS story and matched title plus text; this card uses title only.
- **Sample check:** 20 titles drawn from the newest-1M archive; 0 of 20 did not match the intended meaning.

## h151: Are AI agents replacing chatbots in story titles?
- **Replaces:** h013. The old verdict is not carried over.
- **Audience:** engineers
- **Question:** Are AI agents replacing chatbots in story titles?
- **Terms, side A:** `\bagentic\b|\b(ai|llm|coding|autonomous|software|multi-agent|multi agent|browser) agents?\b|\bagents? (framework|sdk|that|for)\b` (case-insensitive)
- **Terms, side B:** `\bchatgpt\b|\bchatbots?\b|\bgpt-?[0-9][a-z0-9.\-]*\b|\bgpt\b` (case-insensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Share of agent-or-chatbot stories that are about agents: A / (A + C), monthly mean, later divided by earlier.
- **Thresholds (set before any run):** Supported (strong) at ratio 1.25 or more. Supported (weak) at 1.10 or more. Refuted at 1.00 or less. Anything else, inconclusive.
- **Control:** Built into the pair.
- **Minimum count:** each window needs at least 150 matching stories (30 for the points cards, over the whole window). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - The earlier window sits right after ChatGPT launched, so the early base is small. The minimum count rule stops tiny bases from producing a result.
  - A bare "agent" is not matched, to keep out user agents and secret agents; only the phrases listed are.
  - Old card h013 counted agent(s) per chatbot story and matched the word alone.
- **Sample check:** 20 titles drawn from the newest-1M archive; 0 of 20 did not match the intended meaning.

## h152: Is SQL gaining on NoSQL in story titles?
- **Replaces:** h014. The old verdict is not carried over.
- **Audience:** engineers
- **Question:** Is SQL gaining on NoSQL in story titles?
- **Terms, side A:** `\bpostgres(ql)?\b|\bsqlite\b|\bduckdb\b` (case-insensitive)
- **Terms, side B:** `\bmongodb\b|\bdynamodb\b|\bcassandra\b|\bcouchdb\b|\bnosql\b` (case-insensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Share of SQL-or-NoSQL stories on the SQL side: SQL / (SQL + NoSQL), monthly mean, later divided by earlier.
- **Thresholds (set before any run):** Supported (strong) at ratio 1.25 or more. Supported (weak) at 1.10 or more. Refuted at 1.00 or less. Anything else, inconclusive.
- **Control:** Built into the pair.
- **Minimum count:** each window needs at least 150 matching stories (30 for the points cards, over the whole window). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - Old card h014 put MySQL on the NoSQL side. That was wrong, and MySQL is on neither side here.
  - Product names are a proxy for the database families, and news about a company (for example a chief executive change) counts as a match.
- **Sample check:** 20 titles drawn from the newest-1M archive; 0 of 20 did not match the intended meaning.

## h153: Are microservices and serverless fading from story titles?
- **Replaces:** h015. The old verdict is not carried over.
- **Audience:** engineers
- **Question:** Are microservices and serverless fading from story titles?
- **Terms:** `\bmicroservices?\b|\bserverless\b` (case-insensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Share of live stories that match, monthly mean, later divided by earlier.
- **Thresholds (set before any run):** Supported (strong) at ratio 0.80 or less. Supported (weak) at 0.90 or less. Refuted at 1.00 or more. Anything else, inconclusive.
- **Control:** Drift control: the share of live stories whose title has a question word (`\b(how|why|what)\b`, case-insensitive). If its later/earlier ratio is outside 0.85 to 1.15, the card is inconclusive and says title style moved.
- **Minimum count:** each window needs at least 150 matching stories (30 for the points cards, over the whole window). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - Counts titles, not systems built.
- **Sample check:** 20 titles drawn from the newest-1M archive; 0 of 20 did not match the intended meaning.

## h154: Is React losing share of story titles?
- **Replaces:** h016. The old verdict is not carried over.
- **Audience:** engineers
- **Question:** Is React losing share of story titles?
- **Terms:** `\breactjs\b|\breact\.js\b|\breact (native|hooks?|server components?|compiler|router|query|19|18|app|component|components|framework|library)\b|\b(in|with|using|for|to|from|and|vs\.?|or) react\b(?! to\b)|\breact(,| and| or| vs)` (case-insensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Share of live stories that match, monthly mean, later divided by earlier.
- **Thresholds (set before any run):** Supported (strong) at ratio 0.80 or less. Supported (weak) at 0.90 or less. Refuted at 1.00 or more. Anything else, inconclusive.
- **Control:** Drift control: the share of live stories whose title has a question word (`\b(how|why|what)\b`, case-insensitive). If its later/earlier ratio is outside 0.85 to 1.15, the card is inconclusive and says title style moved.
- **Minimum count:** each window needs at least 150 matching stories (30 for the points cards, over the whole window). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - "React" alone is not matched, because it is also a verb. Only the framework phrases listed are, so the share is a floor.
  - The earlier version of this question was tested on a window where the share rose (see the old card h016); this card is a new test on a new window and does not repeat that verdict.
- **Sample check:** 20 titles drawn from the newest-1M archive; 0 of 20 did not match the intended meaning.

## h155: Is the newer front-end stack growing in story titles?
- **Replaces:** h017. The old verdict is not carried over.
- **Audience:** engineers
- **Question:** Is the newer front-end stack growing in story titles?
- **Terms:** `\bnext\.?js\b|\bsvelte(kit)?\b|\bvue(\.js|js)?\b|\bhtmx\b|\btailwind(css)?\b|\bnuxt\b` (case-insensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Share of live stories that match any term, monthly mean, later divided by earlier.
- **Thresholds (set before any run):** Supported (strong) at ratio 1.25 or more. Supported (weak) at 1.10 or more. Refuted at 1.00 or less. Anything else, inconclusive.
- **Control:** Drift control: the share of live stories whose title has a question word (`\b(how|why|what)\b`, case-insensitive). If its later/earlier ratio is outside 0.85 to 1.15, the card is inconclusive and says title style moved.
- **Minimum count:** each window needs at least 150 matching stories (30 for the points cards, over the whole window). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - Astro is left out because the word is also a company and a name. Svelte, Vue, Next.js, htmx, Tailwind and Nuxt are in.
  - Some of these did not exist in the earlier window; the minimum count rule still applies.
- **Sample check:** 20 titles drawn from the newest-1M archive; 0 of 20 did not match the intended meaning.

## h156: Do Docker, Kubernetes and Terraform keep their share of story titles?
- **Replaces:** h018. The old verdict is not carried over.
- **Audience:** engineers
- **Question:** Do Docker, Kubernetes and Terraform keep their share of story titles?
- **Terms:** `\bdocker\b|\bkubernetes\b|\bk8s\b|\bterraform\b` (case-insensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Share of live stories that match any term, monthly mean, later divided by earlier.
- **Thresholds (set before any run):** Supported (strong) at ratio 1.00 or more. Supported (weak) at 0.90 or more. Refuted at 0.75 or less. Anything else, inconclusive.
- **Control:** Drift control: the share of live stories whose title has a question word (`\b(how|why|what)\b`, case-insensitive). If its later/earlier ratio is outside 0.85 to 1.15, the card is inconclusive and says title style moved.
- **Minimum count:** each window needs at least 150 matching stories (30 for the points cards, over the whole window). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - "Keep" means at least 90 percent of the earlier share. A share that grows counts as keeping it.
- **Sample check:** 20 titles drawn from the newest-1M archive; 0 of 20 did not match the intended meaning.

## h157: Are Java, PHP, Ruby and Rails fading from story titles?
- **Replaces:** h019. The old verdict is not carried over.
- **Audience:** engineers
- **Question:** Are Java, PHP, Ruby and Rails fading from story titles?
- **Terms:** `\bjava\b|\bphp\b|\bruby\b|\bruby on rails\b|\bRails\b` (case-insensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Share of live stories that match any term, monthly mean, later divided by earlier.
- **Thresholds (set before any run):** Supported (strong) at ratio 0.80 or less. Supported (weak) at 0.90 or less. Refuted at 1.00 or more. Anything else, inconclusive.
- **Control:** Drift control: the share of live stories whose title has a question word (`\b(how|why|what)\b`, case-insensitive). If its later/earlier ratio is outside 0.85 to 1.15, the card is inconclusive and says title style moved.
- **Minimum count:** each window needs at least 150 matching stories (30 for the points cards, over the whole window). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - Plain JavaScript was in the old card h019 and is out here, because it is a different language.
  - Rails is matched only when capitalized, to keep out the verb ("rails against"). "Java" also matches the island, the coffee and the Minecraft edition (1 of 20 sampled titles).
- **Sample check:** 20 titles drawn from the newest-1M archive; 1 of 20 did not match the intended meaning.

## h158: Do AI coding tool stories earn more points than other stories?
- **Replaces:** h020. The old verdict is not carried over.
- **Audience:** engineers
- **Question:** Do AI coding tool stories earn more points than other stories?
- **Terms:** `\bCursor\b(?!-based|\s+(pagination|position|of|is|in)\b)|\bclaude code\b|\bcopilot\b|\bMCP\b|\bdevin\b|\bcodex\b|\bwindsurf\b` (case-sensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Short-run. Source: this repo's newest-1M archive, complete UTC weeks (10 weeks, Jul 27 to Oct 4 2026 at the time of writing). Weeks have equal weight.
- **Metric:** Points per live story for matching stories divided by points per live story for all other stories, per week, mean of the 10 weekly ratios.
- **Thresholds (set before any run):** Supported (strong) at ratio 1.30 or more. Supported (weak) at 1.10 or more. Refuted at 0.90 or less. Anything else, inconclusive.
- **Control:** Built in: the comparison group is all other live stories in the same week.
- **Minimum count:** each window needs at least 150 matching stories (30 for the points cards, over the whole window). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - Scores are snapshots taken when the data was collected. The newest days are immature.
  - Means are sensitive to a few hits. The top-1-percent-trimmed ratio is shown beside the result and does not change the verdict.
  - Cursor is matched only when capitalized and not as a database cursor. "Copilot" matches any product with that name.
- **Sample check:** 20 titles drawn from the newest-1M archive; 0 of 20 did not match the intended meaning.

## h159: Do SQLite and DuckDB stories earn more points than other stories?
- **Replaces:** h021. The old verdict is not carried over.
- **Audience:** engineers
- **Question:** Do SQLite and DuckDB stories earn more points than other stories?
- **Terms:** `\bsqlite\b|\bduckdb\b` (case-insensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Short-run. Source: this repo's newest-1M archive, complete UTC weeks (10 weeks, Jul 27 to Oct 4 2026 at the time of writing). Weeks have equal weight.
- **Metric:** Same as h158 with the SQLite and DuckDB terms.
- **Thresholds (set before any run):** Supported (strong) at ratio 1.30 or more. Supported (weak) at 1.10 or more. Refuted at 0.90 or less. Anything else, inconclusive.
- **Control:** Built in.
- **Minimum count:** each window needs at least 150 matching stories (30 for the points cards, over the whole window). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - Same snapshot and hit-sensitivity limits as h158.
  - About 20 to 40 matching stories a week; with fewer than 30 in total the card is inconclusive.
- **Sample check:** 20 titles drawn from the newest-1M archive; 0 of 20 did not match the intended meaning.

## h160: Are editor and terminal tools showing up more in story titles?
- **Replaces:** h022. The old verdict is not carried over.
- **Audience:** engineers
- **Question:** Are editor and terminal tools showing up more in story titles?
- **Terms:** `\bneovim\b|\bvim\b|\bemacs\b|\bnixos\b|\bnix\b|\bvs ?code\b|\bvscode\b|\btmux\b` (case-insensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Share of live stories that match any term, monthly mean, later divided by earlier.
- **Thresholds (set before any run):** Supported (strong) at ratio 1.25 or more. Supported (weak) at 1.10 or more. Refuted at 1.00 or less. Anything else, inconclusive.
- **Control:** Drift control: the share of live stories whose title has a question word (`\b(how|why|what)\b`, case-insensitive). If its later/earlier ratio is outside 0.85 to 1.15, the card is inconclusive and says title style moved.
- **Minimum count:** each window needs at least 150 matching stories (30 for the points cards, over the whole window). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - Git and Linux are out. They appear in too many unrelated stories to say anything about tools.
  - Old card h022 included them; this card asks a narrower question and does not carry its verdict over.
- **Sample check:** 20 titles drawn from the newest-1M archive; 0 of 20 did not match the intended meaning.

## h161: Are Rust, Zig and C++ gaining share of story titles?
- **Replaces:** h023. The old verdict is not carried over.
- **Audience:** engineers
- **Question:** Are Rust, Zig and C++ gaining share of story titles?
- **Terms:** `\brust\b(?! belt)|\bzig\b|(?<![\w])c\+\+(?!\w)|(?<![\w.])cpp\b` (case-insensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Share of live stories that match any term, monthly mean, later divided by earlier.
- **Thresholds (set before any run):** Supported (strong) at ratio 1.25 or more. Supported (weak) at 1.10 or more. Refuted at 1.00 or less. Anything else, inconclusive.
- **Control:** Drift control: the share of live stories whose title has a question word (`\b(how|why|what)\b`, case-insensitive). If its later/earlier ratio is outside 0.85 to 1.15, the card is inconclusive and says title style moved.
- **Minimum count:** each window needs at least 150 matching stories (30 for the points cards, over the whole window). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - "Rust belt" is excluded. "llama.cpp" is excluded from the C++ match.
  - A story naming two languages counts once.
- **Sample check:** 20 titles drawn from the newest-1M archive; 0 of 20 did not match the intended meaning.

## h162: Are code review and technical debt coming up more in story titles?
- **Replaces:** h024. The old verdict is not carried over.
- **Audience:** engineers
- **Question:** Are code review and technical debt coming up more in story titles?
- **Terms:** `\bcode reviews?\b|\btechnical debt\b|\btech debt\b|\brefactor(ing|ed)?\b|\blegacy code\b|\bmaintainability\b` (case-insensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Share of live stories that match any term, monthly mean, later divided by earlier.
- **Thresholds (set before any run):** Supported (strong) at ratio 1.25 or more. Supported (weak) at 1.10 or more. Refuted at 1.00 or less. Anything else, inconclusive.
- **Control:** Drift control: the share of live stories whose title has a question word (`\b(how|why|what)\b`, case-insensitive). If its later/earlier ratio is outside 0.85 to 1.15, the card is inconclusive and says title style moved.
- **Minimum count:** each window needs at least 150 matching stories (30 for the points cards, over the whole window). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - Old card h024 added a reason (AI writes more code). This card only asks whether the share rose and makes no claim about why.
- **Sample check:** 20 titles drawn from the newest-1M archive; 0 of 20 did not match the intended meaning.

## h163: Are LLM building blocks (RAG, fine-tuning, embeddings) growing in story titles?
- **Replaces:** h025. The old verdict is not carried over.
- **Audience:** engineers
- **Question:** Are LLM building blocks (RAG, fine-tuning, embeddings) growing in story titles?
- **Terms:** `\bllms?\b|\bRAG\b|\bfine-?tun(e|ing|ed)\b|\bembeddings\b|\bembedding models?\b|\bvector (db|database|search|store)s?\b|\bprompt engineering\b` (case-sensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Share of live stories that match any term, monthly mean, later divided by earlier. The share of stories with the word AI is shown beside it for context and does not change the verdict.
- **Thresholds (set before any run):** Supported (strong) at ratio 1.25 or more. Supported (weak) at 1.10 or more. Refuted at 1.00 or less. Anything else, inconclusive.
- **Control:** Drift control: the share of live stories whose title has a question word (`\b(how|why|what)\b`, case-insensitive). If its later/earlier ratio is outside 0.85 to 1.15, the card is inconclusive and says title style moved.
- **Minimum count:** each window needs at least 150 matching stories (30 for the points cards, over the whole window). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - "RAG" is matched in capitals only. "Embedding" as a verb is not matched; "embeddings" and "embedding model" are.
  - The earlier window is before most of these terms were common; the minimum count rule applies.
- **Sample check:** 20 titles drawn from the newest-1M archive; 0 of 20 did not match the intended meaning.

## h164: Is Rust mentioned more in comments, not only in titles?
- **Replaces:** h026. The old verdict is not carried over.
- **Audience:** engineers
- **Question:** Is Rust mentioned more in comments, not only in titles?
- **Terms:** `\brust\b(?! belt)` (case-insensitive)
- **Matching:** whole words, title only, live stories (comments, for this card); a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Share of live comments that match, monthly mean, later divided by earlier. Comments, not stories.
- **Thresholds (set before any run):** Supported (strong) at ratio 1.25 or more. Supported (weak) at 1.10 or more. Refuted at 1.00 or less. Anything else, inconclusive.
- **Control:** The story-title share of Rust over the same windows (the Rust part of card h161) is shown beside the result so a reader can compare titles and comments. It does not change the verdict.
- **Minimum count:** each window needs at least 150 matching stories (30 for the points cards, over the whole window). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - Comment text is matched, not titles. The "rust" word in comments also means oxidation and a video game; the share is an upper bound.
  - Comment counts for old years come from the full monthly record only.
- **Sample check:** the 20 titles checked were stories, not comments. The data agent must read 20 random matching comments before the first run and record the count here.

## h165: Is Go growing faster than Python in story titles?
- **Replaces:** h027. The old verdict is not carried over.
- **Audience:** engineers
- **Question:** Is Go growing faster than Python in story titles?
- **Terms, side A:** `\bgolang\b|\bGo (language|programming|lang)\b|\b(in|with|using|written in|rewrite in) Go\b|\bGo 1\.(1[0-9]|2[0-9])\b` (case-sensitive)
- **Terms, side B:** `\bpython\b` (case-insensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Growth of the Go share divided by growth of the Python share: (Go later / Go earlier) / (Python later / Python earlier), monthly mean shares of live stories.
- **Thresholds (set before any run):** Supported (strong) at 1.25 or more. Supported (weak) at 1.10 or more. Refuted at 1.00 or less. Anything else, inconclusive.
- **Control:** Built in: Python is the comparison.
- **Minimum count:** each window needs at least 150 matching stories (30 for the points cards, over the whole window). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - "Go" is matched only in the phrases listed (golang, "in Go", "written in Go", "Go language", Go 1.10 to 1.29). That misses many Go stories, so the share is a floor and only its change counts.
  - Both shares are small in the earlier window; the minimum count rule applies to each.
- **Sample check:** 20 titles drawn from the newest-1M archive; 0 of 20 did not match the intended meaning.

## h166: Is Kubernetes fading from story titles?
- **Replaces:** h028. The old verdict is not carried over.
- **Audience:** engineers
- **Question:** Is Kubernetes fading from story titles?
- **Terms:** `\bkubernetes\b|\bk8s\b|\bk3s\b|\bkubectl\b` (case-insensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Share of live stories that match any term, monthly mean, later divided by earlier.
- **Thresholds (set before any run):** Supported (strong) at ratio 0.80 or less. Supported (weak) at 0.90 or less. Refuted at 1.00 or more. Anything else, inconclusive.
- **Control:** Drift control: the share of live stories whose title has a question word (`\b(how|why|what)\b`, case-insensitive). If its later/earlier ratio is outside 0.85 to 1.15, the card is inconclusive and says title style moved.
- **Minimum count:** each window needs at least 150 matching stories (30 for the points cards, over the whole window). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - Overlaps card h156 (Kubernetes is one of its three terms). They ask different questions and can both be shown.
- **Sample check:** 20 titles drawn from the newest-1M archive; 0 of 20 did not match the intended meaning.

## h167: Is Vue growing in story titles?
- **Replaces:** h029. The old verdict is not carried over.
- **Audience:** engineers
- **Question:** Is Vue growing in story titles?
- **Terms:** `\bvue(\.js|js)\b|\bvue [23]\b|\bnuxt\b|\bpinia\b|\b(and|or|like|in|with|for) vue\b|\bvue (and|or)\b|\bvue,|,\s*vue\b` (case-insensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Share of live stories that match any term, monthly mean, later divided by earlier.
- **Thresholds (set before any run):** Supported (strong) at ratio 1.25 or more. Supported (weak) at 1.10 or more. Refuted at 1.00 or less. Anything else, inconclusive.
- **Control:** Drift control: the share of live stories whose title has a question word (`\b(how|why|what)\b`, case-insensitive). If its later/earlier ratio is outside 0.85 to 1.15, the card is inconclusive and says title style moved.
- **Minimum count:** each window needs at least 150 matching stories (30 for the points cards, over the whole window). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - Bare "Vue" is not matched, because it is also a French word and other products. Only the forms listed are. Counts are small, so the minimum count rule matters.
  - Only 8 titles matched in the newest 10 weeks, so the short archive cannot test this card.
- **Sample check:** only 8 titles matched in the newest-1M archive; all 8 were read and 0 did not match the intended meaning.

## h168: Is Java fading from story titles?
- **Replaces:** h030. The old verdict is not carried over.
- **Audience:** engineers
- **Question:** Is Java fading from story titles?
- **Terms:** `\bjava\b` (case-insensitive)
- **Matching:** whole words, title only, live stories; a story matching more than one term counts once.
- **Window and source:** Long-run. Source: the full monthly record through the data agent (stories per calendar month, UTC, from Oct 2006). Later window: the latest 12 complete months at run time. Earlier window: the same 12 calendar months 3 years before.
- **Metric:** Share of live stories that match, monthly mean, later divided by earlier.
- **Thresholds (set before any run):** Supported (strong) at ratio 0.80 or less. Supported (weak) at 0.90 or less. Refuted at 1.00 or more. Anything else, inconclusive.
- **Control:** Drift control: the share of live stories whose title has a question word (`\b(how|why|what)\b`, case-insensitive). If its later/earlier ratio is outside 0.85 to 1.15, the card is inconclusive and says title style moved.
- **Minimum count:** each window needs at least 150 matching stories (30 for the points cards, over the whole window). Fewer: inconclusive, "too few matches".
- **Caveats:**
  - Matches the word Java, so it also matches the coffee, the island and the Minecraft edition.
- **Sample check:** 20 titles drawn from the newest-1M archive; 1 of 20 did not match the intended meaning.

## New card IDs

The next free ID is h150 (the highest used is h149). The Deep-tech cards (#58) continue from h169.

| New ID | Replaces | Question |
|---|---|---|
| h150 | h012 | Is TypeScript taking over from JavaScript in story titles? |
| h151 | h013 | Are AI agents replacing chatbots in story titles? |
| h152 | h014 | Is SQL gaining on NoSQL in story titles? |
| h153 | h015 | Are microservices and serverless fading from story titles? |
| h154 | h016 | Is React losing share of story titles? |
| h155 | h017 | Is the newer front-end stack growing in story titles? |
| h156 | h018 | Do Docker, Kubernetes and Terraform keep their share of story titles? |
| h157 | h019 | Are Java, PHP, Ruby and Rails fading from story titles? |
| h158 | h020 | Do AI coding tool stories earn more points than other stories? |
| h159 | h021 | Do SQLite and DuckDB stories earn more points than other stories? |
| h160 | h022 | Are editor and terminal tools showing up more in story titles? |
| h161 | h023 | Are Rust, Zig and C++ gaining share of story titles? |
| h162 | h024 | Are code review and technical debt coming up more in story titles? |
| h163 | h025 | Are LLM building blocks (RAG, fine-tuning, embeddings) growing in story titles? |
| h164 | h026 | Is Rust mentioned more in comments, not only in titles? |
| h165 | h027 | Is Go growing faster than Python in story titles? |
| h166 | h028 | Is Kubernetes fading from story titles? |
| h167 | h029 | Is Vue growing in story titles? |
| h168 | h030 | Is Java fading from story titles? |
