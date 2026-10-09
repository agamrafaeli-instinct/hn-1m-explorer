# Term definitions: what the hn-1m-explorer repo actually contains

Short answer: the provider's own regex or script for the 70-term set (terms70) is NOT in the repo. Only the daily output files and a few plain-language semantics notes came in. Exact patterns for cpp, nextjs, vscode, fine_tuning and go are not recorded anywhere in the repo or in its git history (searched files and `git log -S`).

## What the repo does say (verbatim sources)

1. data/vcs_history.json, provenance.semantics:
   "Case-insensitive whole-word matching on story title plus text; not snapshot title-only proxies. Points are archive capture-time snapshots, not present-day final scores. Denominators are story total_items from same provider archive."
   Input files named there: dt_daily.csv, dt_topic_monthly.csv, terms70_daily.csv (sha256 recorded in that file; the CSVs themselves are not in the repo).

2. data/engineers_history.json, note (basket composition, patterns not given):
   ts=typescript; js=javascript; agents=agent+agents; chatbot=chatgpt+gpt; sql=postgres+sqlite+duckdb; nosql=mongodb+mysql; dist=microservices+serverless; react=react; newfe=nextjs+svelte+vue+htmx+tailwind; infra=docker+kubernetes+terraform; pragmatic=go+typescript; oldguard=java+php+ruby+rails+javascript; aicode=cursor+claude_code+mcp+copilot+devin; tinker=vscode+neovim+nix+linux+git; syslang=rust+zig+cpp; python=python; rust=rust; maint=code_review+technical_debt; oss=open_source; localdb=sqlite+duckdb; llm=llm+rag+fine_tuning; wasm=wasm; single terms go, kubernetes, vue, java (stories).

3. hypotheses/h027-go-gains-on-python.json caveat on Go:
   "Go matches only golang or capitalized Go; Python is a steady control." and "Text matches in stories, word boundaries, case-insensitive." (This is the card author's description. The exact pattern is not stored.)

4. data/history/terms_daily.csv has 13 terms only: chatgpt, gpt, llm, ai, openai, claude, copilot, rust, python, layoffs, remote, crypto, vibe_coding (daily, stories and comments, Dec 2022 to Jul 31 2026). The 70-term daily file is not in the repo.

## What I tested (Oct 9 2026), against the current archive
Method: whole-word, case-insensitive match on story title plus text, and on comment text; all items counted including dead and deleted; compared with terms_daily.csv on 4 overlap days (Jul 24, 27, 29, 30 2026).
- Reproduced within about 1% to 3%: ai, llm (llm or llms), chatgpt, gpt, openai, claude, copilot, rust, python, remote. Example Jul 24 stories: ai 157 vs 157, llm 30 vs 30, claude 25 vs 25, rust 11 vs 11.
- NOT reproduced by plain whole-word patterns: crypto (mine 3 vs 3 stories on Jul 24 but comments 34 vs 48), layoffs (comments 45 vs 54), vibe_coding (mine 1 vs 5 stories, 31 vs 86 comments). The provider's patterns for these are broader than a plain word. Not known.
- Item counts match the provider's: Jul 24 had 1,521 story items and 11,850 comment items in both, so the same item universe and day boundary (UTC) are in use.

## Not the provider's
scripts/weekly_lists.py (new, mine, for the weekly snapshot) has its own lists. They are my choices and must not be read as the provider's definitions. Go is deliberately not matched there ("golang" only gives about 3 stories a week).
