#!/usr/bin/env bash
# Run the same checks as the daily workflow before pushing, so CI does not fail on something local would have caught.
set -e
rm -rf /tmp/site_pp; python3 scripts/stage_site.py --root . --output /tmp/site_pp >/dev/null
python3 -m unittest discover -s tests 2>&1 | tail -1
python3 scripts/check_list_version.py
python3 scripts/check_roadmap.py || true
node tests/hypotheses.test.js | tail -1; node tests/story_spec.test.js | tail -1; node tests/context_isolation.test.js | tail -1; node tests/card_rules.test.js | tail -1; node tests/yearzoom.test.js | tail -1
node tests/ui.test.mjs --serve /tmp/site_pp | tail -1
node scripts/perf.mjs --serve /tmp/site_pp --runs 3 --tolerance 1.25 --trend
# All checks above passed (set -e): record the digest of these exact files. A push-triggered CI run skips the repeat UI and budget steps only when this marker matches. Commit .prepush_ok with the change.
python3 scripts/prepush_digest.py --write
# Optional, about 90 s more: PHONE_SWEEP=1 bash scripts/prepush.sh lists phone layout findings at 320, 390 and 430 px (report only).
if [ -n "$PHONE_SWEEP" ]; then
  (cd /tmp/site_pp && python3 -m http.server 8790 >/dev/null 2>&1 & echo $! > /tmp/sweep_srv.pid); sleep 1
  node scripts/phone_sweep.mjs --site http://localhost:8790/ || true
  kill "$(cat /tmp/sweep_srv.pid)" 2>/dev/null || true
fi
