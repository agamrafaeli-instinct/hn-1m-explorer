# Restore a saved week from the second copy

After each weekly save, the "Weekly archive" workflow packs data/weekly into `weekly-YYYYMMDD.tar.gz` and publishes it as a release named `weekly-archive-YYYYMMDD` on the repo's Releases page. It checks the pack against data/weekly/hashes.json before publishing, so a bad pack is never published.

## Restore one week
1. Open the newest release at https://github.com/agamrafaeli-instinct/hn-1m-explorer/releases and download the `.tar.gz`.
2. Compare it with the recorded hashes: `python3 scripts/archive_weekly.py compare weekly-YYYYMMDD.tar.gz`. It says which weeks differ or are missing.
3. Put back a missing week: `python3 scripts/archive_weekly.py restore weekly-YYYYMMDD.tar.gz 2026-W35`. It checks the copy against the archive's own hash and never overwrites a file that exists.
4. Run `python3 scripts/verify_weekly.py`. It must say all weeks match. Commit the restored file.

If a week exists but changed, restore it from git history first (see docs/INTEGRITY.md), then use the archive to confirm the copy.

The archive lists saved weeks only. Items from every story since 2006 are covered by the archive manifest, not this copy.
