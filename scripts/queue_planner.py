#!/usr/bin/env python3
"""Keeps the issue queue stocked. Run nightly (and once with --seed).

- Reads queue/backlog.json (items with a stable key). Creates issues for keys not yet seen in any issue (open or closed).
- Adds data-signal items: new 250+ point stories from alerts/alerts.json (one yes/no per story, max 3 per run).
- Keeps at least MIN open 'needs-agam' issues, adding at most MAX_NEW per run. 'ready' backlog items are created only with --seed or when fewer than 3 are open.
- Writes QUEUE.md, a label-based board. Uses only the repo's own API with GITHUB_TOKEN / GH_TOKEN.
Never closes or re-labels an issue a person touched."""
import json, os, re, sys, time, urllib.request, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
REPO = os.environ.get('GITHUB_REPOSITORY', 'agamrafaeli-instinct/hn-1m-explorer'); TOKEN = os.environ.get('GITHUB_TOKEN') or os.environ.get('GH_TOKEN')
MIN, MAX_NEW = 12, 6; DRY = '--dry' in sys.argv; SEED = '--seed' in sys.argv

def api(path, method='GET', data=None):
    req = urllib.request.Request('https://api.github.com/repos/' + REPO + path, method=method, data=json.dumps(data).encode() if data else None,
        headers={'Authorization': 'Bearer ' + TOKEN, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as r: return json.load(r)

def all_issues():
    out, p = [], 1
    while True:
        b = api(f'/issues?state=all&per_page=100&page={p}'); out += [i for i in b if 'pull_request' not in i]
        if len(b) < 100: return out
        p += 1

def keyof(i):
    m = re.search(r'<!-- key: ([\w.-]+) -->', i.get('body') or ''); return m.group(1) if m else None

def mk(item):
    body = (item['body'].rstrip() + '\n\n' if item.get('body') else '') + f"<!-- key: {item['key']} -->"
    if item['labels'] and 'needs-agam' in item['labels'] and 'Reply' not in body: body = 'Reply yes or no.\n\n' + body
    if DRY: print('would create', item['labels'], item['title']); return
    api('/issues', 'POST', {'title': item['title'], 'body': body, 'labels': item['labels']}); time.sleep(1)

def signal_items(seen_keys):
    out = []; f = ROOT / 'alerts/alerts.json'
    if f.exists():
        for a in json.loads(f.read_text())[:20]:
            if time.time() - a['reported_at'] > 36 * 3600: continue
            key = 'sig-story-%s' % a['id']
            if key not in seen_keys: out.append({'key': key, 'title': f"Test a hypothesis about \"{a['title'][:70]}\" ({a['points']} pts)? yes/no", 'labels': ['needs-agam', 'hypothesis'],
                'body': f"This story crossed the alert line: {a['hn']}\n\nYes: an agent drafts a card about its topic for you to review. No: we skip it."})
    return out[:3]

def board(issues):
    lab = lambda i: {l['name'] for l in i['labels']}; op = [i for i in issues if i['state'] == 'open']
    rows = ['# Queue', '', 'Generated nightly from the issue labels. Newest change: ' + time.strftime('%Y-%m-%d', time.gmtime()) + ' UTC.', '']
    for name, title in [('needs-agam', 'Needs Agam'), ('ready', 'Ready for agents'), ('in-progress', 'In progress'), ('review', 'In review')]:
        xs = [i for i in op if name in lab(i)]; rows += [f'## {title} ({len(xs)})', '']
        rows += [f"- [#{i['number']}]({i['html_url']}) {i['title']}" for i in xs] or ['- nothing']; rows.append('')
    done = [i for i in issues if i['state'] == 'closed' or 'done' in lab(i)]; rows.append(f'Done or closed: {len(done)}\n')
    (ROOT / 'QUEUE.md').write_text('\n'.join(rows))

def main():
    issues = all_issues(); seen = {keyof(i) for i in issues if keyof(i)}; lab = lambda i: {l['name'] for l in i['labels']}
    open_na = sum(1 for i in issues if i['state'] == 'open' and 'needs-agam' in lab(i)); open_ready = sum(1 for i in issues if i['state'] == 'open' and 'ready' in lab(i))
    backlog = json.loads((ROOT / 'queue/backlog.json').read_text()); made = 0
    pool = [b for b in backlog if b['key'] not in seen]
    for b in ([] if SEED else signal_items(seen)): pool.insert(0, b)
    for b in pool:
        if SEED and not b.get('seed') and not b['key'].startswith('sig-'): continue
        na = 'needs-agam' in b['labels']; rd = 'ready' in b['labels']
        if na and (open_na >= MIN and not SEED or made >= MAX_NEW and not SEED): continue
        if rd and not SEED and open_ready >= 3: continue
        mk(b); made += 1; open_na += na; open_ready += rd
    print('created', made, 'open needs-agam now', open_na)
    if not DRY: board(all_issues())

if __name__ == '__main__': main()
