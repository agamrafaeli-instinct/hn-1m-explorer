#!/usr/bin/env python3
"""Estimate and actual-time log for board tasks (#240). Minutes everywhere in docs/ESTIMATES.csv.
  est.py start N     log the start time when task N moves to Dev
  est.py done N      write actual minutes (start to now) to the ledger and the board
  est.py est N MIN   set the estimate in minutes on the board
  est.py check       list Ready or Dev tasks that carry no estimate in minutes
  est.py calibrate   median actual / estimate per size
It reads the token itself (GH_TOKEN, then GITHUB_TOKEN, then /tmp/ghtok2, then `gh auth token`) and always prints
a message on failure. The board fields are in hours, so minutes are divided by 60 there."""
import csv, datetime, json, os, re, subprocess, sys

PID = 'PVT_kwHOFD7V3M4BmTmF'
FE, FA, FS = 'PVTF_lAHOFD7V3M4BmTmFzhlGeMc', 'PVTF_lAHOFD7V3M4BmTmFzhlGeNY', 'PVTF_lAHOFD7V3M4BmTmFzhlGeNc'
MIN = {'S': 45, 'M': 120, 'L': 240}  # fallback when the body has a size but no minutes
LED = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'docs', 'ESTIMATES.csv')
COLS = ['issue', 'size', 'estimate_min', 'start_utc', 'done_utc', 'actual_min']
EST_RE = re.compile(r'Estimate:\s*(\d+)\s*min', re.I)


def die(msg):
    print('est.py: ' + msg, file=sys.stderr)
    sys.exit(1)


def token():
    for k in ('GH_TOKEN', 'GITHUB_TOKEN'):
        if os.environ.get(k):
            return os.environ[k]
    if os.path.exists('/tmp/ghtok2'):
        return open('/tmp/ghtok2').read().strip()
    r = subprocess.run(['gh', 'auth', 'token'], capture_output=True, text=True)
    if r.returncode == 0 and r.stdout.strip():
        return r.stdout.strip()
    die('no GitHub token found. Set GH_TOKEN (needs repo and project scopes) and run again.')


ENV = None


def gq(q, **v):
    global ENV
    ENV = ENV or dict(os.environ, GH_TOKEN=token())
    a = ['gh', 'api', 'graphql', '-f', 'query=' + q] + [x for k, y in v.items() for x in ('-f', f'{k}={y}')]
    r = subprocess.run(a, capture_output=True, text=True, env=ENV)
    if r.returncode:
        die('GitHub call failed: ' + (r.stderr.strip() or r.stdout.strip())[:300])
    try:
        d = json.loads(r.stdout)
    except ValueError:
        die('GitHub returned something that is not JSON: ' + r.stdout[:200])
    if d.get('errors'):
        die('GitHub returned errors: ' + json.dumps(d['errors'])[:300])
    return d


def items():
    out, cur = [], None
    q = ('query($a:String){user(login:"agamrafaeli-instinct"){projectV2(number:1){items(first:100,after:$a){pageInfo{hasNextPage endCursor} nodes{id '
         'est:fieldValueByName(name:"Estimate (h)"){... on ProjectV2ItemFieldNumberValue{number}} '
         'st:fieldValueByName(name:"Status"){... on ProjectV2ItemFieldSingleSelectValue{name}} '
         'content{... on Issue{number state title labels(first:8){nodes{name}} body}}}}}}}')
    while True:
        d = gq(q, **({'a': cur} if cur else {}))['data']['user']['projectV2']['items']
        out += [n for n in d['nodes'] if n['content']]
        if not d['pageInfo']['hasNextPage']:
            return out
        cur = d['pageInfo']['endCursor']


def find(n):
    m = [x for x in items() if x['content'].get('number') == n]
    if not m:
        die(f'issue #{n} is not on the board.')
    return m[0]


def set_number(item, field, val):
    gq('mutation($p:ID!,$i:ID!,$f:ID!){updateProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,fieldId:$f,value:{number:%s}}){projectV2Item{id}}}' % val,
       p=PID, i=item, f=field)


def set_date(item, field, val):
    gq('mutation($p:ID!,$i:ID!,$f:ID!,$v:Date!){updateProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,fieldId:$f,value:{date:$v}}){projectV2Item{id}}}',
       p=PID, i=item, f=field, v=val)


def minutes_of(x):
    """Estimate in minutes: the 'Estimate: N min' line in the body, else the board hours x 60, else None."""
    m = EST_RE.search(x['content'].get('body') or '')
    if m:
        return int(m.group(1))
    h = (x.get('est') or {}).get('number')
    return round(h * 60) if h else None


def size_of(x):
    m = re.search(r'\*\*Estimate\.\*\*\s*([SML])\b', x['content'].get('body') or '')
    return m.group(1) if m else ''


def rows():
    if not os.path.exists(LED):
        return []
    r = list(csv.DictReader(open(LED)))
    if r and 'estimate_h' in r[0]:  # old hours ledger
        r = [dict(issue=a['issue'], size=a['size'], estimate_min=round(float(a['estimate_h']) * 60) if a['estimate_h'] else '',
                  start_utc=a['start_utc'], done_utc=a['done_utc'], actual_min=round(float(a['actual_h']) * 60) if a['actual_h'] else '') for a in r]
    return r


def save(r):
    with open(LED, 'w', newline='') as f:
        w = csv.DictWriter(f, COLS)
        w.writeheader()
        w.writerows(r)


now = lambda: datetime.datetime.now(datetime.timezone.utc)
iso = lambda d: d.strftime('%Y-%m-%dT%H:%M:%SZ')


def main(argv):
    if len(argv) < 2:
        die("usage: est.py start N | done N | est N MIN | check | calibrate")
    cmd = argv[1]
    if cmd in ('start', 'done', 'est') and len(argv) < 3:
        die(f'usage: est.py {cmd} N' + (' MIN' if cmd == 'est' else ''))
    if cmd == 'start':
        n = int(argv[2]); x = find(n); est = minutes_of(x)
        r = [a for a in rows() if a['issue'] != str(n)]
        r.append(dict(issue=n, size=size_of(x), estimate_min=est if est is not None else '', start_utc=iso(now()), done_utc='', actual_min=''))
        save(r)
        set_date(x['id'], FS, now().strftime('%Y-%m-%d'))
        if est is None:
            print(f'warning: #{n} has no estimate in minutes. Add "Estimate: N min" to the ticket or run: est.py est {n} MIN', file=sys.stderr)
        print(f'started #{n}' + (f', estimate {est} min' if est is not None else ''))
    elif cmd == 'done':
        n = int(argv[2]); x = find(n); r = rows(); hit = False
        for a in r:
            if a['issue'] == str(n) and a['start_utc']:
                mins = round((now() - datetime.datetime.strptime(a['start_utc'], '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=datetime.timezone.utc)).total_seconds() / 60)
                a['done_utc'] = iso(now()); a['actual_min'] = mins; hit = True
                set_number(x['id'], FA, round(mins / 60, 2))
                print(f'actual #{n}: {mins} min' + (f' (estimate {a["estimate_min"]} min)' if a['estimate_min'] != '' else ''))
        if not hit:
            die(f'no start logged for #{n}. Run "est.py start {n}" first, or add the row to docs/ESTIMATES.csv by hand.')
        save(r)
    elif cmd == 'est':
        n = int(argv[2])
        if not argv[3:] or not argv[3].isdigit():
            die('give the estimate as whole minutes, for example: est.py est 236 45')
        x = find(n); set_number(x['id'], FE, round(int(argv[3]) / 60, 2)); print(f'#{n}: {argv[3]} min')
    elif cmd == 'check':
        bad = [x for x in items() if (x['st'] or {}).get('name') in ('Ready', 'Dev') and x['content'].get('state') == 'OPEN'
               and 'epic' not in [l['name'] for l in x['content']['labels']['nodes']] and minutes_of(x) is None]
        for x in bad:
            print(f"#{x['content']['number']} {x['content']['title']}: no estimate in minutes")
        print(f'{len(bad)} Ready or Dev tasks without an estimate in minutes')
        sys.exit(1 if bad else 0)
    elif cmd == 'calibrate':
        import statistics as st
        d = [a for a in rows() if a['actual_min'] != '' and a['estimate_min'] != '']
        print(len(d), 'closed with estimate and actual')
        for z in ('S', 'M', 'L', ''):
            q = [float(a['actual_min']) / float(a['estimate_min']) for a in d if a['size'] == z and float(a['estimate_min'])]
            if q:
                print((z or 'none') + ' n=%d median actual/est=%.2f' % (len(q), st.median(q)))
        q = [float(a['actual_min']) / float(a['estimate_min']) for a in d if float(a['estimate_min'])]
        if q:
            print('within 50%%: %d%%' % (100 * sum(0.5 <= v <= 1.5 for v in q) // len(q)))
    else:
        die('unknown command ' + cmd + '. Use start, done, est, check or calibrate.')


if __name__ == '__main__':
    main(sys.argv)
