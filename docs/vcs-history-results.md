# VC full-history extension h115-h119
Input: provider history Dec 2022-Jul 2026; Jan 2023-Jun 2026 retained, both endpoints conservatively excluded. 42 months. Date coverage checked; complete extraction of all HN stories is NOT independently verified.
First six months vs last six mean monthly archive story share:
- h115 data_center 4.633x, supported strong. Share 0.0741% to 0.3432%.
- h116 gpu 2.128x, supported strong. Share 0.2005% to 0.4266%.
- h117 robotics 1.292x, supported weak for persistence (at least 80% retained), not strong growth. 0.2851% to 0.3684%.
- h118 solar all matches 0.744x, refuted strong. 0.1970% to 0.1466%. NOT solar energy only: astronomy/eclipse contamination; do not present it as evidence solar adoption fell. Peak April 2024 share, descriptive only.
- h119 data centers after top ten stories removed EACH MONTH, last six months: points/story vs rest 0.953x, inconclusive. Top ten account for 19.5%-49.4% of monthly matching points. Attention growth does not guarantee broadly distributed premium.
Matching semantics: provider case-insensitive word-boundary title PLUS text. data_center matches data center/data centre; robotics robot(s)/robotics, including nonphysical uses. No safe eclipse subtraction from marginal counts. These differ from earlier title-only discovery proxies. No exact replication claim.
Points are archive snapshots, not live final counts. Mean monthly rates equally weight months; endpoint cohorts descriptive, not independent trials. No mainstream-leading, causality, technical-validation, investment-return, funding, startup-status or meeting recommendations established.
Reproduce: python3 scripts/vcs_history.py INPUT_FOLDER (dt_daily.csv, dt_topic_monthly.csv, terms70_daily.csv); node tests/hypotheses.test.js. Input SHA256 and provider semantics in data/vcs_history.json. Full CSV data not copied into patch; summarized monthly series retained for site.
Source repo checked previously https://github.com/agamrafaeli-instinct/hn-1m-explorer ; new CSVs supplied by data track through parent. They are source data supplied for this analysis, not live independent source verification.
