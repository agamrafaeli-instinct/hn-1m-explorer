# Sharing: links and previews

Status: spec for epic #66 (Ripple).

## Today

- The Share button on a card (hypotheses.js) copies or shares `<site>/#/c/<card>/<audience>`. On phones it opens the share sheet with the card title.
- A week screen is `#/w/<audience>/<week>`. The router sets the page title and description in the browser after load (router.js, loadWeek). Old `#/a/<audience>` links redirect to `#/hypotheses`.
- The site is static, one `index.html`. Chat apps and link previewers do not run scripts and ignore the part of a link after `#`. So every shared link previews as the home page: "Hacker News posts, explored".

## What a previewer reads

Title, description and an image from `<title>`, `<meta name="description">` and `og:` tags in the HTML the server returns for that exact path. The path must exist as a file on the host.

## Scheme

Small share pages, one file each, built at deploy. Each has its own title, description and og tags, shows a plain link, and sends the reader on at once to the hash route for the same view.

| Page | Path | Redirects to |
| --- | --- | --- |
| Card | `share/c/<card>.html` (69 cards) | `#/c/<card>` |
| Week | `share/w/<audience>/<week>.html` for each saved week in `data/findings/` | `#/w/<audience>/<week>` |
| Story page | `share/p/<route>.html` for `phoenix` and `rings` | `#/<route>` |
| Current week | `share/w/<audience>/current.html` | the newest saved week for that audience |

Titles and summaries come from the card file (`hypotheses/*.json` title) and the saved week file (`data/findings/<week>.json`, the published headline). A share page never holds a number that is not in those files.

## Build

A script, `scripts/build_share_pages.py`, runs in the deploy before the site is staged, and `stage_site.py` lists `share` among its directories. A test fails when a card or saved week has no page, or when a page title differs from its source.

## Tasks

- #211 and #212 done (scripts/build_share_pages.py), #212 week and audience pages, #213 point the Share button at these pages.

## Limits

- Previews for a new week appear after that deploy.
- An image is left out until a plain one exists; text previews are enough for chat apps.
