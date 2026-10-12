#!/usr/bin/env bash
# Quarantine a bad day (#253): put every tracked file back to the last good commit, remove files this run added, and open one issue.
#   scripts/quarantine.sh REPORT.txt [TITLE]
# Nothing is saved from the bad run. The run then carries on from the last good data, so the site is republished from it.
# One issue at a time: while an issue labelled data-quarantine is open, later bad days add a comment. DRY_RUN=1 skips the issue.
set -e
report=$1; title=${2:-"Data quarantined: today's update was not saved"}
cp "$report" /tmp/quarantine_report.txt
git checkout -q -- .
git clean -fdq -e "$report" -e data_checks.txt -e contract.txt
cp /tmp/quarantine_report.txt "$report"
[ -n "$DRY_RUN" ] && { echo "quarantined (dry run)"; exit 0; }
{ echo "The daily run found a break in the data and did not save today's update. The last good data and site stay live; nothing was deleted. Run: $GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"; echo; echo '```'; tail -40 /tmp/quarantine_report.txt; echo '```'; echo; echo "Fix the cause (docs/DATA_CHECKS.md, docs/RUNBOOK.md), then run the daily workflow by hand. Close this issue once a run saves data again."; } > /tmp/quarantine_body.md
gh label create data-quarantine --color B60205 --description 'A bad data day was quarantined' 2>/dev/null || true
num=$(gh issue list --repo "$GITHUB_REPOSITORY" --label data-quarantine --state open --json number -q '.[0].number // empty')
if [ -n "$num" ]; then gh issue comment "$num" --repo "$GITHUB_REPOSITORY" --body-file /tmp/quarantine_body.md
else gh issue create --repo "$GITHUB_REPOSITORY" --label data-quarantine --title "$title" --body-file /tmp/quarantine_body.md; fi
