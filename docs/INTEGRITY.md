# Saved weeks: integrity check

Saved weeks (data/weekly/YYYY-Www.json) cannot be rebuilt once they leave the archive window. `data/weekly/hashes.json` records a sha256 for each.

- `python scripts/verify_weekly.py` fails with a plain message when a recorded week is missing, changed, or a week exists that is not recorded.
- It runs at the start of every daily run (daily-hn.yml) and before and after the weekly save (weekly-snapshot.yml). A problem is therefore seen the same day, as a failed run.
- `--add-new` records the hash of a newly saved week. The weekly job does this. A recorded hash is never changed by the script.
- To accept a deliberate replacement, a person edits hashes.json in the same commit and says why in the commit message.
- Fix for a missing or changed week: restore the file from git history (`git checkout <commit> -- data/weekly/<week>.json`).

A second copy of the weeks is tracked in #220.
