#!/usr/bin/env bash
# Run the same checks as the daily workflow before pushing, so CI does not fail on something local would have caught.
set -e
SECONDS=0
rm -rf /tmp/site_pp; python3 scripts/stage_site.py --root . --output /tmp/site_pp >/dev/null
# Independent checks run as parallel jobs, each with its own log in /tmp/pp. Perf runs alone afterwards so its timing stays stable.
mkdir -p /tmp/pp; rm -f /tmp/pp/*.log /tmp/pp/*.rc
job() { local name=$1; shift; ( "$@" >"/tmp/pp/$name.log" 2>&1; echo $? >"/tmp/pp/$name.rc" ) & }
job unit python3 -m unittest discover -s tests
job lists python3 scripts/check_list_version.py
job roadmap bash -c 'python3 scripts/check_roadmap.py || true'
job node bash -c 'for t in hypotheses story_spec context_isolation card_rules yearzoom; do node tests/$t.test.js | tail -1; [ "${PIPESTATUS[0]}" = 0 ] || { echo "FAILED tests/$t.test.js"; exit 1; }; done'
job ui node tests/ui.test.mjs --serve /tmp/site_pp
wait
failed=""
for n in unit lists roadmap node ui; do
  echo "== $n: $( (grep -E '^(OK|FAILED)|passed|FAIL' /tmp/pp/$n.log || tail -n 5 /tmp/pp/$n.log) | tail -1)"
  [ "$(cat /tmp/pp/$n.rc 2>/dev/null || echo 1)" = 0 ] || failed="$failed $n"
done
if [ -n "$failed" ]; then
  echo "PREPUSH FAILED in:$failed"
  for n in $failed; do echo "---- $n (last 25 lines of /tmp/pp/$n.log)"; tail -25 "/tmp/pp/$n.log"; done
  exit 1
fi
node scripts/perf.mjs --serve /tmp/site_pp --runs 3 --tolerance 1.25 --trend
# All checks above passed (set -e): record the digest of these exact files. A push-triggered CI run skips the repeat UI and budget steps only when this marker matches. Commit .prepush_ok with the change.
echo "prepush took ${SECONDS}s"
python3 scripts/prepush_digest.py --write
# Optional, about 90 s more: PHONE_SWEEP=1 bash scripts/prepush.sh lists phone layout findings at 320, 390 and 430 px (report only).
if [ -n "$PHONE_SWEEP" ]; then
  (cd /tmp/site_pp && python3 -m http.server 8790 >/dev/null 2>&1 & echo $! > /tmp/sweep_srv.pid); sleep 1
  node scripts/phone_sweep.mjs --site http://localhost:8790/ || true
  kill "$(cat /tmp/sweep_srv.pid)" 2>/dev/null || true
fi
