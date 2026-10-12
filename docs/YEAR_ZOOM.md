# Year zoom: spec (#205, epic #204)

Decision (2026-10-12): requested by the owner on the full-history story screen. Full history stays the default. A zoom is the reader's choice, is written on the chart, and is never applied by default (the no-windows rule, see WINDOW_READERS.md).

## Time-series line charts today

| Where | Chart | Data file | First and last month | Notes |
|---|---|---|---|---|
| Story screen, long view (`story.js` hist) | Stories, comments, story points per month | `data/history/strips.json` | 2022-12 to 2026-07 | Only about 44 months. This is not the full history. The points series exists only here. |
| Explorer (`history.js`) | Stories per month, comments per month | `data/atlas/months.json` | 2006-10 to 2026-08 (counts stop at 2026-07, the archive month 2026-08 is partial) | Full history. |
| Explorer (`history.js`) | One word, all years | `data/atlas/terms-<letter>.json` | 2006-10 to 2026-07 | Same month list. |
| Home (`compare.js`) | Compare chart | `data/topic_series.json` | 2006-10 to 2026-07 (236 months) | Design center of the site. |
| Cards and weeks (`hypotheses.js` strip) | Longer context strip | card source files | varies | Out of scope for this epic. |

Not time series, so not touched: the concentration curves, the clock, the weekday and hour bars, the lens bars.

Finding for #207: the story-screen monthly charts cover only 44 months today, so a year zoom on them is nearly pointless. Task #207 first moves stories and comments to `data/atlas/months.json` (2006 onward). Points per month needs a full-history source (the daily counts in `data/history/daily.csv` run from 2006-10; check it carries points before using it). If it does not, the points chart keeps its own range and says so on the chart.

## The control

- Two year pickers, First and Last, listing the years the chart has data for. Preset buttons: All years (default, selected), Last 5 years, Last 10 years. Reset returns to All years.
- One control per screen, shown above the first chart. Every time-series chart on that screen follows it.
- At 390 px the control is one row of two selects and a row of three preset buttons, each tap target at least 44 px.
- The chosen range is written next to each chart title ("2018 to 2022") and in the chart's text label for screen readers. Nothing about the range is implied; All years is written as "All years, 2006 to 2026".
- Labels stay on the line ends, no legend, as on the other charts.

## URL form

`#/story?years=2018-2022` and `#/explore?years=2018-2022`. A single year is `years=2020` (January to December of that year). Missing or `all` means all years. The router keeps the rest of the hash. Good input is clamped to the years that have data. Bad input (letters, first after last, outside the data) falls back to All years and the control shows All years.

## Edge cases

- A range under 12 months of data (for example the first or last partial year): the chart still draws; the caption states the months shown.
- A one-year range: month labels on the x axis; for longer ranges year labels.
- Months with partial data (2026-08 in the archive, counts stop at 2026-07) stay excluded as they are today, with the same footnote.
- An empty range (no months): the chart is replaced by "No data for these years" and the control stays usable.
- Captions (start, end, peak) are recomputed for the chosen range.

## Acceptance for the epic

Each chart task checks All years and one chosen range by screenshot at 390 px, runs `scripts/a11y_pages.mjs` at 320, 390 and 430 px, and stays inside `data/budgets.json` (raise it in the same commit if needed).
