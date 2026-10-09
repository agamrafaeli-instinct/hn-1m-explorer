# Hacker News dataset layout (v1)

The data is a snapshot, not a live feed. Read `data/manifest.json` first. All manifest paths are relative to the repository/site root. `data/summary.json` lets charts load before CSV chunks.

## CSV

UTF-8, comma delimiter, RFC 4180 quoting, CRLF line endings, one header per chunk. Commas, quotes, Unicode, and embedded newlines are retained. Use a real CSV parser, never split on commas or newlines. A blank cell means missing or empty; the CSV does not distinguish empty strings from null strings. Null integers remain blank, not zero. Booleans are 0 or 1.

| Column | Type | Meaning |
| --- | --- | --- |
| id | integer | Unique HN item ID |
| type | string | HN item type |
| by | string | Author handle |
| time | nullable integer | Unix timestamp, UTC seconds |
| title | string | Source title |
| url | string | External URL |
| domain | string | Lowercase URL hostname without leading www. |
| score | nullable integer | Score at collection time |
| descendants | nullable integer | Comment count at collection time |
| text | string | Full source HTML text |
| dead | boolean | Item marked dead |
| deleted | boolean | Item marked deleted |

Except id, dead, and deleted, missing fields are nullable. No text is shortened. Text, title, author, and URLs are untrusted source content. Render text with `textContent`, not `innerHTML`; permit only HTTP(S) external links. Use the standard HN item endpoint with the numeric id for discussion links. CSV cells are source-faithful, not spreadsheet-formula neutralized: import string fields as text if using spreadsheet software. A browser CSV parser must preserve embedded newlines.

## Ordering, chunks, and manifest

Rows are ordered by `time DESC, id DESC`, with missing times last. Each row appears exactly once. Chunks target a maximum of 8,388,608 encoded bytes including the header. A row larger than the target is an error, not silently cut.

The manifest includes schema_version, generated_at (UTC), total_rows, column descriptions, CSV dialect, chunk_target_bytes, order, summary_path, source provenance, total_csv_bytes, and chunks. Each chunk includes path, rows, bytes, SHA-256, min_id, max_id, min_time, and max_time. Time bounds exclude missing timestamps. Chunk min/max IDs are bounds, not a claim that every ID in that interval exists. Use time bounds to prune overlapping date searches, not to infer missing items. ID order can differ from time order.

## Summary

`summary.json` contains total_rows, totals (posts, score_sum, comments_sum, dead, deleted, missing_time, missing_score, missing_comments), time_range {min,max}, type_counts, monthly [{month,posts,score_sum,comments_sum}], top_domains [{domain,posts}], top_authors [{by,posts}], and top_posts. Monthly values use UTC calendar months. The domain and author lists contain up to 100 entries; top_posts contains up to 100 rows ordered by score, then time, then id, without text. Scores and comments are summed only where known; missing values do not count as known zeroes.

Summary values cover every input row. The manifest's source section must document which item types are included, cutoff and retrieval timestamps, source URLs, selection method, exact count, and completeness limitations. The layout itself cannot establish that the input is exactly the newest posts it claims.

## Reproduce

Python 3 standard library only:

```sh
python3 scripts/prepare_data.py raw.jsonl.gz \
  --source-json source.json --expected-rows <total rows> --output prepared
python3 -m unittest discover -s tests -v
```

Native Firebase fields and Algolia hits are accepted. Inputs may be multiple JSONL or JSONL.gz files. Duplicate IDs, invalid integers, wrong counts, and oversized rows are errors. Processing uses temporary SQLite storage so the full source need not fit in RAM. Run in a fresh output folder. Preserve the task 1 source metadata in source.json.

## GitHub sizing

Checked against GitHub documentation during preparation: normal Git rejects files over 100 MiB and warns above 50 MiB; browser uploads allow at most 25 MiB. GitHub Pages published sites may not exceed 1 GB. The converter refuses dataset content over 900,000,000 bytes to leave space for the site; actual final site size must still be checked.

- https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
