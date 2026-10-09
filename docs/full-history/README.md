# Full-history narrative strips: first 56 cards

Data only. No site code, card verdict or deployment change.

Install data/full_history/*.json at those paths. data/full_history/index.json maps IDs to paths. Each per-card file has rows, labels, a_label/b_label, exact definition, original check/verdicts, original regex, same-archive numerator/denominator fields when meaningful, and quality flags.

The monthly rows use UTC calendar months. Coverage is Oct 9, 2006 through Oct 8, 2026 inclusive. First and last months are partial. These are exploratory/descriptive views, not a re-test of weekly hypotheses. Keep the old-window verdict displayed and label it with its old window. Monthly strips must not be presented as validated full-history verdicts. The existing thresholds are preserved but not applied to a changed-bin experiment.

The source is the current ClickHouse SQL Playground origin named by the HF archive, not the frozen legacy play.clickhouse.com table. Source: https://sql.clickhouse.com/ ; mirror: https://huggingface.co/datasets/open-index/hacker-news . HF and origin score/descendant fields matched exactly for 48 deterministic sampled stories in Nov/Dec 2023 and Dec 2025/Jan 2026. Live Firebase differs materially in Nov 2023 and Jan 2026, confirming stale capture snapshots. score-comparison-fixed.json records the samples. These small samples are not correction factors.

Unknown origin engagement fields are encoded as -1. Negative sentinels are not summed. Known-field round-2 rates exclude these from relevant denominators; original zero-fill scripts use zero while retaining all eligible stories. Title-count trends are not adoption and coverage is not independently certified complete. Point, hit-rate, comments and discussion strips need a visible snapshot-quality warning.

Monthly robustness removals are recalculated within each month, not silently equated with the original whole-window or weekly removal. Top-domain ties are lexical; VC top-five excludes blank hosts (which stay outside). The frozen plan and original contracts are included for review.

No visual verification was performed because this is a data-only transfer. The site owner must inspect rendered strips at 390px before calling the site change ready.

## Remaining 24 cards

h012-h030 and h115-h119 have no replacement full-record series in this package. Their existing history is Jan 2023-Jun 2026 only. Exact original terms70 special regex definitions are not in the repository; recovering an old semantic note does not make a new regex identical. Do not label these cards full record until definitions are recovered and data computed, or until a user-approved explicitly new definition is introduced. See original-definitions-gap.md.
