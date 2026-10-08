#!/usr/bin/env python3
"""Report HN stories at or above a points threshold, once each.

New = created within WINDOW_HOURS. State: alerts/seen.json. Output: GitHub issues
(when GITHUB_TOKEN and GITHUB_REPOSITORY are set) and alerts/alerts.json (newest first).
"""
import json, os, time, urllib.parse, urllib.request, pathlib
THRESHOLD = int(os.environ.get('THRESHOLD', 350)); WINDOW_HOURS = int(os.environ.get('WINDOW_HOURS', 72))
ROOT = pathlib.Path(__file__).resolve().parent.parent; SEEN = ROOT / 'alerts/seen.json'; ALERTS = ROOT / 'alerts/alerts.json'

def fetch(now):
    q = urllib.parse.urlencode({'tags': 'story', 'hitsPerPage': 100,
        'numericFilters': f'points>={THRESHOLD},created_at_i>{int(now - WINDOW_HOURS * 3600)}'})
    with urllib.request.urlopen('https://hn.algolia.com/api/v1/search_by_date?' + q, timeout=30) as r:
        return json.load(r)['hits']

def new_hits(hits, seen):
    return [h for h in hits if str(h['objectID']) not in seen]

def issue(h):
    repo, tok = os.environ.get('GITHUB_REPOSITORY'), os.environ.get('GITHUB_TOKEN')
    if not (repo and tok): return None
    hn = f"https://news.ycombinator.com/item?id={h['objectID']}"
    body = f"{h.get('points')} points, {h.get('num_comments') or 0} comments, by {h.get('author')}\n\nDiscussion: {hn}\n" + (f"Link: {h['url']}\n" if h.get('url') else '')
    req = urllib.request.Request(f'https://api.github.com/repos/{repo}/issues', method='POST',
        data=json.dumps({'title': f"HN {h.get('points')} pts: {h.get('title')}", 'body': body}).encode(),
        headers={'Authorization': 'Bearer ' + tok, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as r: return json.load(r)['html_url']

def main():
    now = time.time(); seen = json.loads(SEEN.read_text())['seen']
    alerts = json.loads(ALERTS.read_text()) if ALERTS.exists() else []
    hits = new_hits(fetch(now), seen); print('qualifying new stories:', len(hits))
    for h in sorted(hits, key=lambda h: h['created_at_i']):
        url = None if os.environ.get('SEED') == 'true' else issue(h)
        seen[str(h['objectID'])] = int(now)
        alerts.insert(0, {'id': h['objectID'], 'title': h.get('title'), 'points': h.get('points'), 'comments': h.get('num_comments'),
            'author': h.get('author'), 'hn': f"https://news.ycombinator.com/item?id={h['objectID']}", 'url': h.get('url'),
            'created_at': h.get('created_at'), 'reported_at': int(now), 'issue': url})
        SEEN.write_text(json.dumps({'seen': seen}, indent=1)); ALERTS.write_text(json.dumps(alerts, indent=1))  # persist per item so a crash never re-reports
        print('reported', h['objectID'], h.get('points'), h.get('title'))
    if not hits: ALERTS.write_text(json.dumps(alerts, indent=1))

if __name__ == '__main__': main()
