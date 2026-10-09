#!/usr/bin/env python3
"""Append each card's verdict and confidence to data/verdicts/log.csv, one row per card per day.
Reads the tally built by stage_site.py. A rerun on the same date adds nothing."""
import argparse, csv, json, sys
from datetime import datetime, timezone
from pathlib import Path
FIELDS = ['date', 'card_id', 'verdict', 'confidence']

def card_id(name):
    return name.split('-')[0]

def append(tally, log, date):
    """Return the number of rows added."""
    log = Path(log)
    seen = set()
    if log.is_file():
        with log.open(newline='') as f:
            for r in csv.DictReader(f):
                seen.add((r['date'], r['card_id']))
    rows = []
    for t in sorted(tally, key=lambda x: x['name']):
        if t.get('error'):
            continue
        k = (date, card_id(t['name']))
        if k in seen:
            continue
        seen.add(k)
        rows.append({'date': date, 'card_id': k[1], 'verdict': t['verdict'], 'confidence': t['confidence']})
    if rows:
        log.parent.mkdir(parents=True, exist_ok=True)
        new = not log.is_file() or log.stat().st_size == 0
        with log.open('a', newline='') as f:
            w = csv.DictWriter(f, FIELDS, lineterminator='\n')
            if new:
                w.writeheader()
            w.writerows(rows)
    return len(rows)

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--tally', default='_site/hypotheses/tally.json')
    p.add_argument('--log', default='data/verdicts/log.csv')
    p.add_argument('--date', default=datetime.now(timezone.utc).strftime('%Y-%m-%d'))
    a = p.parse_args()
    tally = json.loads(Path(a.tally).read_text())
    print('verdict log: added', append(tally, a.log, a.date), 'rows for', a.date)

if __name__ == '__main__':
    sys.exit(main())
