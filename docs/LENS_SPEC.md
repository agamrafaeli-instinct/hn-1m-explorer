# Lens: one page for one site or name

Spec for the Lens epic (#86). Status: proposed. Nothing is built yet.

## What the page is

A page for one site (a domain such as `github.com`) or one name from the watchlist (such as Nvidia), showing how often it appeared in the saved weeks.

## Fields, only from saved weekly files

Taken from `data/weekly/<week>.json` for every saved week. Nothing else is read.

| Field | Source in the file | Shown as |
|---|---|---|
| Stories per week | `top_domains` (sites) or the watchlist counts (names) | A small bar per week |
| Points of those stories | the same entries, `points` | A number beside each bar |
| Top stories of the week that match | `top_stories` | Up to 3 links to Hacker News |
| First week seen in the saved files | the earliest week with a count | One line |

A site or name that is in no saved week's top list shows "Not in the top list for any saved week." This is not the same as zero.

## How a reader opens it

From a site or name in a week screen. The link is `#/lens/<site or name>`, for example `#/lens/github.com`. The key is matched to a saved key, never used as HTML.

## What the page does not claim

- No company events, funding, launches or news. The page has no data on them.
- No sentiment and no "good or bad". A count is a count.
- No claim about all of Hacker News. Only saved weeks, only story titles and the top lists.
- Names that are also common words (Apple, Meta) are matched when capitalised, as in the watchlist, and the page says that.
- A week that was rebuilt later is marked, as on the week screens.

## Load budget

Same as a week screen: 1.9 s, 227 KB and 23 requests at 390px on slow 4G ([BUDGETS.md](BUDGETS.md)). Data: the weekly index plus one small file per saved week for the matching entries. If those requests are too many, a single precomputed `data/lens/index.json` is built by the weekly job.
