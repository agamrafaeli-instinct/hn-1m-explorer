# Tracked names, domains and terms

Spec for #226, epic #68 (Spyglass). Status: proposed. The owner's actual lists are waiting on #227.

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
- `domains`: a site such as `github.com`. Matched on the story link host, with `www.` ignored.
- `terms`: a word or phrase matched on titles the same way as the other word lists.
- A name with several spellings is one entry with a list: `{ "label": "Hugging Face", "match": ["hugging face", "huggingface"] }`. A plain string means the label and the only spelling.
- At most 25 entries per audience, so a screen stays short on a phone.
- The VC `watchlist` is replaced by `tracked.vcs.names` once the owner has chosen. Until then `watchlist` stays as the fallback and the screen keeps saying it is a starter list.

## Versioning

- Any edit to `lists.json` bumps `list_version` by one whole number, in the same commit. A test fails when the file changed and the version did not (compared with the previous commit's copy in CI, or with the hash recorded in `data/lists_hash.txt`).
- A saved week keeps the version it used. A later edit never rewrites it. Screens say "Tracked list version N" under the list, taken from the week file.
- A name added later shows no counts for earlier weeks. The screen says "added in version N", never a zero.

## How the weekly build reads it

`weekly_snapshot.py` reads `tracked` for each audience, counts stories matching each entry for the week, and writes the counts under `audiences.<audience>.tracked` with the list version. The week screen draws the list from that block, so a list edit needs no code change.

## Tasks to build this (not yet created)

1. Loader and counts in the weekly build, with tests.
2. Week screen section "Tracked", at 390 px.
3. Version bump check.
4. Replace the starter list once the owner's lists arrive (#227).
