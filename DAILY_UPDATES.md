# Daily Hacker News updates

The schedule is paused pending owner go-ahead. The intended schedule is once a day at 02:23 UTC (09:23 in Bangkok); it can be run manually from the Actions tab. GitHub can delay scheduled runs. This is a rolling dataset, not an ever-growing archive: it keeps the newest 1,000,000 available HN items by creation time, including comments, stories, jobs, polls, deleted and dead items.

Each successful run scans every ID after the last successful checkpoint through Firebase's current maxitem. That adds the latest day's items in normal daily operation and catches up automatically after missed runs. A run that would scan more than 250,000 new IDs stops for review; use the script's --max-new option for a larger catch-up. Network failures are retried, then fail the job without advancing the checkpoint. Null item IDs are listed in manifest.daily_update.unavailable_ids and retried on the next run, including when maxitem has not changed. The count may be below a million if that many records are not available.

The updater checks the existing CSV hashes, sizes, row counts and newest-first ordering before using them. It never executes or renders HN source text. New rows are deduplicated by numeric ID. Credential-shaped strings in text, title and URL are replaced with [REDACTED-SECRET] using the same redaction patterns as the initial export before normalization, CSV output or summary generation. The concentration block is recomputed across all retained rows, not just the daily additions. It preserves full unchanged chunks rather than shifting every chunk boundary each day. New or changed chunks use stable hash-based filenames, remain at most 8 MiB, and retain full source text. Retention removes old rows/chunks. Manifest and summary are generated from the same retained data and committed together. Source scores and comment counts are snapshots at first retrieval, not daily refreshes.

The site must use **GitHub Actions** as its Pages source (Settings > Pages > Build and deployment). A GITHUB_TOKEN commit does not trigger another workflow or branch-based Pages build, so this workflow explicitly uploads and deploys the updated site after committing. It also deploys main-branch site changes. Only static site assets, data and vendor files enter the Pages artifact, not git history or updater scripts. Publication is refused above a 900,000,000-byte safety budget, below Pages' 1 GB limit.

The workflow uses GitHub's short-lived GITHUB_TOKEN with contents:write only for the build/update job, and pages:write plus id-token:write for deployment. It needs no HN API key or personal access token at runtime. Repository Actions must allow this workflow to write contents. A concurrent push causes the commit step to stop rather than overwrite someone else's changes; the next run catches up. Initial publication must finish before the workflow is installed.

Test locally:

```sh
python3 -m unittest discover -s tests -v
python3 scripts/update_daily.py --root .
```

Operations: check the Actions tab for failed runs and data/manifest.json for generated_at, last_scanned_id and unavailable_ids. Public-repository schedules may be disabled by GitHub after 60 days without repository activity, and scheduled jobs have no guaranteed exact start time. Successful daily commits count as activity; watch the Actions tab if no items are added for an extended period. Older Git objects still accumulate over time even though published size is bounded. Keep shallow checkouts, and review history size periodically; no automatic destructive history rewrite is included.

Sources:
- https://raw.githubusercontent.com/HackerNews/API/master/README.md
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
