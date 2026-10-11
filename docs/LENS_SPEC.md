# Lens: pages for one site or one name

Spec for the Lens epic (#86). A lens page follows one domain or one watchlist name across the saved weeks. It restates counts from the saved weekly files and explains nothing.

## What a page may use

Only the saved weekly files, `data/weekly/<week>.json`, and nothing else:

| Page shows | Field | Notes |
|---|---|---|
| Stories per week, domain | `domains["<domain>"][0]` | Each week lists every domain with 3 or more stories (WEEKLY_SPEC.md section 6). A domain missing from a week had 0, 1 or 2 stories, so the page shows "under 3", not zero. |
| Points per week, domain | `domains["<domain>"][1]` | Points are as first retrieved, the same as every week screen. |
| Mentions per week, name | `vcs.watchlist.mentions["<name>"]` | Counts stories whose title or text mentions the name. Zero is a real zero. |
| Top story that week, domain | `top_stories` and the per-domain top story where the file has one | Linked to the HN item. A week with none shows no line. |
| First seen | the first saved week where the count is above 0 (name) or 3 or more (domain) | Worded "first seen in the saved weeks", never "first appeared on Hacker News". |

## Which entries get a page

- Domains that appear in at least 3 saved weeks (290 of 1082 today).
- Every name in `vcs.watchlist.mentions` (27 today).
- Entries are listed in `data/lens/index.json`. A link to a page that does not exist is never shown.

## Address

- `#/l/<domain>` for a domain, for example `#/l/anthropic.com`.
- `#/l/n/<name>` for a name, with the name URL-encoded.

## What the page shows

1. Heading: the domain or name, and one line: "N saved weeks, first seen in <week>".
2. Line chart of stories per week (domain) or mentions per week (name). Label at the line end, no legend. Weeks under the floor draw as a gap, not zero.
3. Up to 5 top stories across the saved weeks, each with its week, points and comments.
4. The caveats below.

## Floors and caveats (copied from the week screens)

- Under 8 stories in a week is too small to count: show "seen" or "none" there, not a number, as the week screens do.
- "Hacker News talking, not a measure of what is true."
- Counts use stories only. Dead and deleted stories keep no title, so name mentions divide by live stories.
- Weeks rebuilt from the archive after they ended carry the same backfill note as on the week screen, and the chart marks them.
- A name match is a word list match on titles and text. It does not say who is talking about the company or why.
- Only the saved weeks (10 today) are shown. No claim is made about any other week.

## Data loaded

The page loads `data/lens/index.json` and one `data/lens/<id>.json`, each under 10 KB. It never loads the weekly files in the browser.
