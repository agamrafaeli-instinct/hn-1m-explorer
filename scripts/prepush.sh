#!/usr/bin/env bash
# Run the same checks as the daily workflow before pushing, so CI does not fail on something local would have caught.
set -e
SECONDS=0
rm -rf /tmp/site_pp; python3 scripts/stage_site.py --root . --output /tmp/site_pp >/dev/null
# Independent checks run as parallel jobs, each with its own log in /tmp/pp. Perf runs alone afterwards so its timing stays stable.
mkdir -p /tmp/pp; rm -f /tmp/pp/*.log /tmp/pp/*.rc
job() { local name=$1; shift; ( "$@" >"/tmp/pp/$name.log" 2>&1; echo $? >"/tmp/pp/$name.rc" ) & }
job unit python3 -m unittest discover -s tests
job copy python3 scripts/copy_lint.py
job lists python3 scripts/check_list_version.py
job roadmap bash -c 'python3 scripts/check_roadmap.py || true'
job node bash -c 'for t in hypotheses story_spec context_isolation card_rules yearzoom; do node tests/$t.test.js | tail -1; [ "${PIPESTATUS[0]}" = 0 ] || { echo "FAILED tests/$t.test.js"; exit 1; }; done'
rm -rf /tmp/site_ui; python3 scripts/make_ui_fixture.py --stage /tmp/site_ui >/dev/null  # UI check on the fixed data (#336)
job ui node tests/ui.test.mjs --serve /tmp/site_ui
wait
failed=""
for n in unit copy lists roadmap node ui; do
  echo "== $n: $( (grep -E '^(OK|FAILED)|passed|FAIL' /tmp/pp/$n.log || tail -n 5 /tmp/pp/$n.log) | tail -1)"
  [ "$(cat /tmp/pp/$n.rc 2>/dev/null || echo 1)" = 0 ] || failed="$failed $n"
done
if [ -n "$failed" ]; then
  echo "PREPUSH FAILED in:$failed"
  for n in $failed; do echo "---- $n (last 25 lines of /tmp/pp/$n.log)"; tail -25 "/tmp/pp/$n.log"; done
  exit 1
fi
# Perf budgets and the phone sweep run in CI only (#250): a 2 GB machine gives noisy load times.
# All checks above passed (set -e): record the digest of these exact files. CI always runs the UI check on live data and the perf budgets. Commit .prepush_ok with the change.
echo "prepush took ${SECONDS}s"
python3 scripts/prepush_digest.py --write
