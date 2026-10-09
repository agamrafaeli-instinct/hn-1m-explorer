#!/usr/bin/env python3
"""Daily digest of HN stories at or above a points threshold, once each.

New = created within WINDOW_HOURS. State: alerts/seen.json. Output: GitHub issues
alerts/alerts.json (newest first) and alerts/digest.md (last ~24h, plain text).
"""
import json, os, time, urllib.parse, urllib.request, pathlib
THRESHOLD = int(os.environ.get('THRESHOLD', 250)); WINDOW_HOURS = int(os.environ.get('WINDOW_HOURS', 72))
ROOT = pathlib.Path(__file__).resolve().parent.parent; SEEN = ROOT / 'alerts/seen.json'; ALERTS = ROOT / 'alerts/alerts.json'

def fetch(now):
    q = urllib.parse.urlencode({'tags': 'story', 'hitsPerPage': 1000,
        'numericFilters': f'points>={THRESHOLD},created_at_i>{int(now - WINDOW_HOURS * 3600)}'})
    with urllib.request.urlopen('https://hn.algolia.com/api/v1/search_by_date?' + q, timeout=30) as r:
        return json.load(r)['hits']

def new_hits(hits, seen):
    return [h for h in hits if str(h['objectID']) not in seen]

def digest(alerts, now, hours=25):
    rows = [a for a in alerts if now - a['reported_at'] <= hours * 3600]
    day = time.strftime('%Y-%m-%d', time.gmtime(now))
    if not rows: return f"HN digest {day} (UTC): no new stories crossed {THRESHOLD} points.\n"
    out = [f"HN digest {day} (UTC): {len(rows)} new stories at {THRESHOLD}+ points"]
    for a in sorted(rows, key=lambda a: -(a['points'] or 0)):
        out.append(f"- {a['points']} pts, {a['comments'] or 0} comments: {a['title']}")
    return "\n".join(out) + "\n"

def main():
    now = time.time(); seen = json.loads(SEEN.read_text())['seen']
    alerts = json.loads(ALERTS.read_text()) if ALERTS.exists() else []
    hits = new_hits(fetch(now), seen); print('qualifying new stories:', len(hits))
    for h in sorted(hits, key=lambda h: h['created_at_i']):
        seen[str(h['objectID'])] = int(now)
        alerts.insert(0, {'id': h['objectID'], 'title': h.get('title'), 'points': h.get('points'), 'comments': h.get('num_comments'),
            'author': h.get('author'), 'hn': f"https://news.ycombinator.com/item?id={h['objectID']}", 'url': h.get('url'),
            'created_at': h.get('created_at'), 'reported_at': int(now)})
        SEEN.write_text(json.dumps({'seen': seen}, indent=1)); ALERTS.write_text(json.dumps(alerts, indent=1))  # persist per item so a crash never re-reports
        print('reported', h['objectID'], h.get('points'), h.get('title'))
    ALERTS.write_text(json.dumps(alerts, indent=1))
    (ROOT / 'alerts/digest.md').write_text(digest(alerts, now))

if __name__ == '__main__': main()
