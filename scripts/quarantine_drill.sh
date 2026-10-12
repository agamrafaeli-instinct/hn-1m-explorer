#!/usr/bin/env bash
# Drill for the bad-day quarantine (#340). Works on the checkout it runs in and never pushes or opens a data-quarantine issue:
# break data/manifest.json, expect the contract check to catch it, quarantine with DRY_RUN, expect the tree back at the last commit
# and the contract check to pass again. Exit 1 with a reason if any step does not hold. Run it only in a throwaway checkout (CI) or a clean tree.
set -u
cd "$(dirname "$0")/.."
[ -z "$(git status --porcelain)" ] || { echo "DRILL SKIPPED: tree is not clean, run it in a fresh checkout"; exit 2; }
fail() { echo "DRILL FAILED: $1"; git checkout -q -- . 2>/dev/null; exit 1; }
python3 scripts/contract.py --base HEAD >/tmp/drill_before.txt 2>&1 || fail "the contract already fails on the last commit: $(tail -3 /tmp/drill_before.txt | tr '\n' ' ')"
python3 -c "import json;m=json.load(open('data/manifest.json'));m['total_rows']-=5;json.dump(m,open('data/manifest.json','w'),indent=1)"
python3 scripts/contract.py --base HEAD >contract.txt 2>&1 && fail "the contract check did not catch a manifest that lost 5 rows"
DRY_RUN=1 bash scripts/quarantine.sh contract.txt >/dev/null 2>&1 || fail "quarantine.sh returned an error"
rm -f contract.txt
[ -z "$(git status --porcelain)" ] || fail "quarantine left changes behind: $(git status --porcelain | head -3 | tr '\n' ' ')"
python3 scripts/contract.py --base HEAD >/dev/null 2>&1 || fail "the contract fails after quarantine"
echo "DRILL OK: bad day caught, tree restored, contract passes again"
