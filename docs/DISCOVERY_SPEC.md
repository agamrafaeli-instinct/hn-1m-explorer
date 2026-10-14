# Bearings: topic shifts with inspectable evidence

Scope: topic pages and the existing Compare view. Existing charts and cards stay. No new findings or verdict labels are added. Sources are `data/topic_series.json` for topic labels, matcher and fixed windows, and `data/film_shares.json` for monthly match counts and story totals.

## Fixed latest window

Use the latest 12 months named by `topic_series.windows.latest`. Never move this window when an earlier baseline changes. Do not assume the latest calendar year is complete. Resolve months by their YYYY-MM labels rather than array positions shared between files.

## Earlier baseline

The default is every available month before the first latest-window month. A reader may choose a whole-year range, restricted to years ending before that first latest-window year. The default can include earlier months within the latest window's first year; an explicit whole-year range cannot. Name that difference in the UI. Year choices come from the source months, not hardcoded dates.

For either period, sum its topic match counts and all-story totals first, then divide. Do not average monthly percentages. Show matched count, total story count and pooled share. Latest-to-baseline ratio equals latest pooled share divided by baseline pooled share.

Reject reversed ranges and any range overlapping the fixed latest window. Empty periods have no value. A zero total has no share. If the baseline share is zero, show ratio unavailable rather than Infinity; report the underlying counts so the reader can inspect the case. Never imply certainty from a ratio.

## Topic identity and dictionaries

Require a topic ID present in both sources. `film_shares.terms[id].pattern` and `topic_series.topics[id].matcher` must agree exactly. On a mismatch, flag the inconsistency and omit the affected comparison/download rather than silently use another dictionary. Monthly count field is the term ID plus `_s`; denominator is `total`. Title matching ignores case. Topic groups overlap: a story naming two topics may count in both.

## Links and state

Keep existing topic, topic-selection and chart-year URLs. A baseline uses `base=YYYY-YYYY` on the valid topic route. Omitting base means all earlier months. Validate both years against available eligible years. Chart zoom (`years`) and baseline (`base`) are different controls: zoom changes displayed months, baseline changes the comparison period. Copy/share keeps both when chosen. Unknown or invalid baseline values return to the explicit default with a short note, not a hidden different range.

## Evidence CSV

For a valid topic, export one row per available source month in chronological order: topic_id, month, matched_titles, all_story_titles, share. Quote text correctly, preserve zeroes, and use an empty share for zero totals. The visible note names the dictionary, case-insensitive title matching, source file and month coverage. The exact matcher stays visible with a link to its source. No points, comments, people or framework-usage claims are inferred from title counts.

## Checks

The pure calculation helper must have tests for unequal monthly totals, empty range, zero denominator, zero baseline share, reversed/overlapping ranges, missing fields and matcher mismatch. Reproduce the default latest/prior pooled counts and shares in topic_series within numeric tolerance; any disagreement is a data blocker, not a reason to change the data.

UI checks cover default, chosen baseline, reload, shared state and error cases at 390 px. CSV checks compare every row against source values. Existing Compare and card checks stay green. No existing hypothesis card, threshold or stored result is edited.
