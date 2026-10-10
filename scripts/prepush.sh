#!/usr/bin/env bash
# Run the same checks as the daily workflow before pushing, so CI does not fail on something local would have caught.
set -e
rm -rf /tmp/site_pp; python3 scripts/stage_site.py --root . --output /tmp/site_pp >/dev/null
python3 -m unittest discover -s tests 2>&1 | tail -1
node tests/hypotheses.test.js | tail -1; node tests/story_spec.test.js | tail -1; node tests/context_isolation.test.js | tail -1; node tests/card_rules.test.js | tail -1
node tests/ui.test.mjs --serve /tmp/site_pp | tail -1
node scripts/perf.mjs --serve /tmp/site_pp --runs 3 --tolerance 1.25
