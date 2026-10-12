# File sweep (2026-10-12)

Method: every tracked file outside data/, hypotheses/, share/, stories/, docs/, tests/ and .github/ was searched for by name in the rest of the repo. Nine had no reference.

Removed:
- DAILY_UPDATES.md. It said the schedule was paused and described a rolling dataset with a row count. Both are out of date. The jobs and recovery are in docs/RUNBOOK.md.
- scripts/pull_hn.py. The first one-off export of a fixed number of rows. scripts/update_daily.py and scripts/archive_append.py replaced it.

Kept, with the reason:
- scripts/film_vc.py, film_engineers.py, film_geeks.py, film_curious.py. They write the film cards. Cards are rebuilt from them when a card is upgraded.
- scripts/make_stories.py. Writes stories/<id>.json for film cards.
- scripts/last_closed.py. Updates the "Last closed" line in README.md. Run by the site agent after a close.
- demo/yearzoom.html. A demo page of the year zoom, published with the site.

Data files are never removed by a sweep. Re-run the method above after large changes.
