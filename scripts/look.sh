#!/usr/bin/env bash
# One command to look at a page at phone width (#244).
#   scripts/look.sh '#/rings' [out.png] [js]     -> prints the png path
# Fresh stage every time, local server on port 8766, 390 px wide screenshot.
set -e
cd "$(dirname "$0")/.."
route="${1:-#/}"; out="${2:-/tmp/look.png}"; js="${3:-0}"
pkill -x chrome 2>/dev/null || true
stage=/tmp/look_site.$$
python3 scripts/stage_site.py --root . --output "$stage" >/dev/null
(cd "$stage" && python3 -m http.server 8766 --bind 127.0.0.1 >/dev/null 2>&1) &
srv=$!
trap 'kill $srv 2>/dev/null; rm -rf "$stage"' EXIT
sleep 1
node scripts/shot390.mjs "http://127.0.0.1:8766/index.html$route" "$out" "$js" >/dev/null
echo "$out"
