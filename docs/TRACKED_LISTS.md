# Tracked names, domains and terms

Spec for #226, epic #68 (Spyglass). Status: proposed. Decision (2026-10-12): domains are the top 1,000 domains by points, across the full archive. Names and terms keep the starter lists for now, flagged as starter lists.

## Today

- All word lists live in one file, `data/lists.json`, with a `list_version` string (now `"1"`). `scripts/weekly_lists.py` loads it.
- The Deep-tech VC screen tracks a starter list of 27 names, `lists.json` key `watchlist` (OpenAI, Anthropic, Nvidia and so on). Its note says it is a starter list to be replaced.
- Every saved week records the version it used in `methods.list_version` (data/weekly/<week>.json) and in the `list_version` column of the exports.

## Proposed shape

Keep one file and add one key, `tracked`, per audience. Nothing else moves.

```json
"tracked": {
  "engineers": { "names": ["Postgres"], "domains": ["github.com"], "terms": ["rust", "sqlite"] },
  "vcs":       { "names": ["OpenAI"],   "domains": [],             "terms": ["fusion"] },
  "geeks":     { "names": [],           "domains": [],             "terms": [] }
}
```

- `names`: a product, company or person. Matched on story titles, case-insensitive, whole words.
- `domains`: a site such as `github.com`. Matched on the story link host, with `www.` ignored. Not typed by hand: see Domains below.
- `terms`: a word or phrase matched on titles the same way as the other word lists.
- A name with several spellings is one entry with a list: `{ "label": "Hugging Face", "match": ["hugging face", "huggingface"] }`. A plain string means the label and the only spelling.
- At most 25 names and 25 terms per audience, so a screen stays short on a phone. Domains are a separate, much longer list (below) and the screen shows only the biggest movers.
- The VC `watchlist` is replaced by `tracked.vcs.names` once the owner has chosen. Until then `watchlist` stays as the fallback and the screen keeps saying it is a starter list.

## Domains: top 1,000 by points

- The list is the 1,000 domains with the most total story points across the whole archive (2006 to the latest saved month). It is the same for every audience, and it lives in `data/tracked_domains.json`, built by `scripts/tracked_domains.py` from `data/archive/`. No window.
- Caveat to show beside it: archive scores are as fetched, and stories from 2025 and 2026 carry low scores, so the ranking leans on earlier years.
- The list is rebuilt on purpose, not every day, so counts stay comparable: `python scripts/tracked_domains.py`. The file has its own `version`, bumped when the set of domains changes (not when only points move). Lists.json `list_version` is not touched. Each compare file records the domain list version it used (`tracked_domains.version`).
- Built 2026-10-12: version 1, archive 2006-10 to 2026-08, top five by points: github.com, nytimes.com, techcrunch.com, twitter.com, medium.com.
- Counts come from the domain counts each saved week already holds (domains with 3 or more stories). A tracked domain with fewer counts as 0. Weekly build: `scripts/weekly_compare.py` writes `tracked_domains` (movers only, 10 per direction, same rose and fell rule as the other lists) into data/compare/<week>.json. Saved weeks (data/weekly) are not changed.
- The weekly build counts stories per tracked domain for the week. The week screen shows only the domains that moved most (the same rose and fell rules the other lists use), never 1,000 rows.
- Names and terms: no list from the owner yet. The starter list stays, and the screen keeps its starter-list note.

## Versioning

- Any edit to `lists.json` bumps `list_version` by one whole number, in the same commit. A test fails when the file changed and the version did not (compared with the previous commit's copy in CI, or with the hash recorded in `data/lists_hash.txt`).
- A saved week keeps the version it used. A later edit never rewrites it. Screens say "Tracked list version N" under the list, taken from the week file.
- A name added later shows no counts for earlier weeks. The screen says "added in version N", never a zero.

## How the weekly build reads it

`weekly_snapshot.py` reads `tracked` for each audience, counts stories matching each entry for the week, and writes the counts under `audiences.<audience>.tracked` with the list version. The week screen draws the list from that block, so a list edit needs no code change.

## Tasks

- #228 domain list build and weekly counts, #229 Tracked section on the week screens, #230 version bump check, #231 owner names and terms (waits on a list from the owner; the starter list stays until then).

## Changing a list needs a new version

data/lists_versions.json records a hash of the lists for each list_version. A test and scripts/prepush.sh fail if data/lists.json changes while list_version stays the same. To change a list: edit it, bump list_version, then run `python3 scripts/check_list_version.py --record`.
