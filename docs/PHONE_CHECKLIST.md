# Phone layout checklist

Every new or changed screen passes this at 320, 390 and 430 px wide before it ships. "Auto" means a script checks it today; "Eye" means look at a screenshot. Past findings: [ACCESSIBILITY.md](ACCESSIBILITY.md).

| # | Item | Pass line | How |
|---|---|---|---|
| 1 | No sideways scroll | `document.documentElement.scrollWidth` is at most the viewport width, at 320, 390 and 430 px | Auto: tests/ui.test.mjs at 390; Eye at 320 and 430 (the sweep in #222 automates it) |
| 2 | Text contrast | At least 4.5:1 for body text, 3:1 for text of 24 px or larger | Auto: `node scripts/a11y_pages.mjs` |
| 3 | Tap targets | Buttons, pills, arrows and links the reader taps are at least 44 px tall and wide, or have 8 px of space around them | Eye now; the sweep in #222 automates it |
| 4 | Labels | Every icon button and every chart has an `aria-label` or visible text that says what it is | Auto for charts (tests/ui.test.mjs); Eye for buttons |
| 5 | Keyboard | Tab reaches every control in reading order, a focus ring shows, and Enter or Space works | Eye, with a keyboard in desktop Chrome |
| 6 | Reduced motion | Animations stop under `prefers-reduced-motion: reduce` | Eye: grep the CSS for the media query next to each new animation |
| 7 | Chart ends | Line labels sit on the line ends, no legend, no label cut off at 320 px | Eye: screenshot at 320 and 390 |
| 8 | Reading size | Body text is at least 15 px and line length fits without zoom | Eye |
| 9 | Fast enough | Stays inside its budget in data/budgets.json | Auto: scripts/prepush.sh |

## How to run it

1. Stage the site and serve it: `python3 scripts/stage_site.py --root . --output /tmp/site2` then any static server.
2. Run `node tests/ui.test.mjs` and `node scripts/a11y_pages.mjs`.
3. Screenshot the screen at 320, 390 and 430 px and go through the Eye items.
4. Note any failure in the PR with the screen, the width and the item number.
