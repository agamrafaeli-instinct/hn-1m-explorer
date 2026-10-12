#!/usr/bin/env python3
"""Build the text of a failure issue and decide whether to retry the run once (#242).
  failure_report.py --jobs jobs.json --log log.txt --sha SHA --msg 'subject' --url URL --wf NAME --attempt N
jobs.json is `gh run view ID --json jobs`; log.txt is `gh run view ID --log-failed`. Prints JSON: {body, retry, failing}."""
import argparse, json, re


def failing_steps(jobs):
    out = []
    for j in jobs.get('jobs', []):
        for s in j.get('steps', []):
            if s.get('conclusion') == 'failure':
                out.append(f"{j.get('name', '?')} / {s.get('name', '?')}")
    return out


def time_only(failing, log):
    """True when the only failure is the load-budget step and every OVER reason in the log is a time reason."""
    if not failing or not all('load time' in f.lower() for f in failing):
        return False
    reasons = []
    for line in log.splitlines():
        if 'OVER:' in line:
            reasons += [r.strip() for r in line.split('OVER:', 1)[1].split(';') if r.strip()]
    return bool(reasons) and all(r.startswith('time ') for r in reasons)


def tail(log, n=30):
    clean = lambda l: re.sub(r'\x1b\[[0-9;]*m|\^\[\[[0-9;]*m', '', re.sub(r'^[^\t]*\t[^\t]*\t\ufeff?\d{4}-\d\d-\d\dT[\d:.]+Z ', '', l))
    lines = [clean(l) for l in log.splitlines() if l.strip()]
    return '\n'.join(lines[-n:])


def build(jobs, log, sha, msg, url, wf, attempt):
    failing = failing_steps(jobs)
    retry = attempt == 1 and time_only(failing, log)
    body = [f'The run failed: {url}', '',
            '**Failing step:** ' + ('; '.join(failing) if failing else 'not found in the job list, open the run'),
            f'**Last commit:** {sha[:7]} {msg}', '', 'Last 30 lines of the failing step log:', '```', tail(log) or '(no log lines returned)', '```', '',
            ('A time-only budget failure is retried once automatically.' if retry else
             'No automatic retry: ' + ('this was already a retry.' if attempt != 1 else 'the failure is not a load-time-only budget failure.')),
            'The last good site stays live. The next scheduled run catches up. This issue stays open until someone closes it.']
    return {'body': '\n'.join(body), 'retry': retry, 'failing': failing}


if __name__ == '__main__':
    a = argparse.ArgumentParser()
    for k in ('jobs', 'log', 'sha', 'msg', 'url', 'wf'):
        a.add_argument('--' + k, required=True)
    a.add_argument('--attempt', type=int, default=1)
    x = a.parse_args()
    try:
        jobs = json.load(open(x.jobs))
    except Exception:
        jobs = {}
    try:
        log = open(x.log, errors='replace').read()
    except Exception:
        log = ''
    print(json.dumps(build(jobs, log, x.sha, x.msg, x.url, x.wf, x.attempt)))
