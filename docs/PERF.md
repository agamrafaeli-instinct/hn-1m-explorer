# Explorer load on a slow phone

Measured on 2026-10-14 against the live Pages site after commit 5d3e5bc. These are one cold-cache run per choice, not medians or measurements on a physical phone. Chrome runs in a shared environment; elapsed times can vary.

Profile: 390 x 844 viewport at 2x, 150 ms latency, 204,800 bytes/second download (about 1.64 Mbps), 93,750 bytes/second upload, 4x CPU slowdown. Cache disabled. Source: `scripts/measure_explorer_load.mjs`, using Chrome network completion events for transferred bytes. Timing starts at the Load click and ends when the CSV load finishes, not when the Load button appears.

| Choice | Files | Posts | Ready before tap | Load after tap | CSV bytes transferred | All completed response bytes | Requests |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Preset manual Load | 231 | 77,072 | 1.792 s | 117.316 s | 10,277,725 | 10,684,856 | 262 |
| Smallest slice | 3 | 332 | 1.908 s | 2.420 s | 47,204 | 454,287 | 34 |

All-response bytes include initial page assets and unrelated history data loaded before the tap. CSV bytes isolate the actual slice requests. Manifest size estimates are uncompressed file sizes, so they differ from transferred bytes. The preset option said about 25 MB; the smallest option said about 109 KB. The data snapshot and file counts will change as daily builds add stories.

Both loads completed, with zero horizontal overflow. Raw results: `docs/perf/2026-10-14-default.json` and `docs/perf/2026-10-14-small.json`. They include option labels and loaded date spans.

## Judgment

The preset manual Load is over the 10-second target by a wide margin. The page being ready in under two seconds does not mean its posts are loaded. Existing `scripts/perf.mjs` checks the Load button, so it does not measure this wait.

Proposed fix: preset the smallest slice for manual Load, keep all larger choices, and keep Search more as an explicit step. Filter links without a size already start with the smallest slice. A separate check should measure the load through completion, so a fast shell cannot hide a slow data load.

No site behavior changed for this measurement ticket.

## Repeat after the small preset (#454)

After deploy 7de0d19, the same cold-cache profile measured the new manual default at **2.854 seconds after the Load click**. The page was ready before the tap in 1.770 seconds. It loaded 3 files and 665 posts; CSV transfer was 86,481 bytes, and all completed responses totaled 493,992 bytes across 34 requests. Zero horizontal overflow.

This is one repeat run, not a median. The daily snapshot changed since the first measurement (332 posts then, 665 now), so the counts and bytes are not a fixed-size controlled comparison. The slow preset choice was replaced with the existing smallest slice; larger choices and Search more remain available. Raw result: `docs/perf/2026-10-14-default-after-454.json`.
