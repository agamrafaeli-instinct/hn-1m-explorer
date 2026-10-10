# Explorer links: open the explorer on a week, an audience and a term

Spec for the Compass epic (#70). Status: proposed. Today only `#/explore` works and it opens with no filter.

## Link format

Links are hash links, so they work on GitHub Pages with no server.

`#/explore?week=2026-W40&aud=engineers&term=postgres`

| Part | Values | Meaning |
|---|---|---|
| `week` | A saved week such as `2026-W40`. Optional. | Limits the list to stories from that week. |
| `aud` | `engineers`, `vcs`, `geeks`. Optional. | Selects the audience, which picks the word list the term comes from. |
| `term` | A key from the saved week (`postgres`, `claude_code`) or free text. Optional. | Filters story titles. A key uses the same whole-word match as the weekly snapshot. Free text uses the explorer's existing word search (space means AND). |

Rules: unknown values are ignored and the explorer opens unfiltered. Values are URL-encoded, read as plain text and never put in the page as HTML. The link of a week screen item sets all three.

## What loads

The explorer already loads the newest-1M archive in range reads. A week link does not load more. It filters the rows already loaded by the week's start and end dates, taken from `data/weekly/index.json` (about 2 KB). The week files themselves (about 55 KB raw, 12 KB gzipped, plus the compare file at about 8 KB raw, 3 KB gzipped) are not needed to open the explorer. They are only read if the page shows the week's totals above the list.

## Limits

- Weeks older than the archive (about 11 weeks) cannot be opened. The link then shows "This week is older than the archive held here."
- The explorer filters stories by title. Counts on the week screen also include story text and comments, so a list can be shorter than the count. The page says so.

## Budget

The explorer budget stays as in [BUDGETS.md](BUDGETS.md): 350 ms, 43 KB, 11 requests at 390px on slow 4G.
