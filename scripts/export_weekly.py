#!/usr/bin/env python3
"""Write data/exports/weekly.csv: one row per week and metric, from the compare files in data/compare/.
Columns are explained in docs/EXPORTS.md.  Usage: python scripts/export_weekly.py [--root DIR]"""
import argparse, csv, json, pathlib

COLS = ['week', 'start_utc', 'kind', 'audience', 'section', 'metric', 'value', 'unit', 'estimate', 'last_week', 'avg_last_4', 'flag', 'list_version']

def rows(c):
    base = dict(week=c['week'], start_utc=c['start_utc'], kind=c.get('kind', ''), list_version=c.get('list_version', ''))
    def r(aud, sec, metric, value, unit, est='', last='', avg='', flag=''):
        return {**base, 'audience': aud, 'section': sec, 'metric': metric, 'value': value, 'unit': unit, 'estimate': est, 'last_week': last, 'avg_last_4': avg, 'flag': flag}
    for k, u in (('stories_all', 'stories'), ('stories_live', 'stories'), ('comments_all', 'comments')):
        if k in c.get('volume', {}): yield r('all', 'volume', k, c['volume'][k], u)
    for aud, a in c.get('audiences', {}).items():
        for f in a.get('facts', []): yield r(aud, 'fact', f['label'], f['value'], 'stories')
        for b in a.get('bars', []):
            for x in b['rows']: yield r(aud, 'bar: ' + b['title'], x['label'], x['value'], b.get('unit', ''), 'yes' if b.get('estimated') else 'no')
        for s in a.get('shares', []): yield r(aud, 'share', s['label'], s['this'], 'share of stories', last=s.get('last', ''), avg=s.get('avg4', ''), flag=s.get('state', ''))
        for flag in ('rose', 'fell'):
            for x in a.get(flag, []): yield r(aud, 'term', x['label'], x['this'], 'stories', last=x.get('last', ''), flag=flag)
        for x in a.get('new', []): yield r(aud, 'term', x['label'], x['this'], 'stories', last=x.get('last', ''), flag='new')

def export(root):
    root = pathlib.Path(root); out = root / 'data' / 'exports' / 'weekly.csv'; out.parent.mkdir(parents=True, exist_ok=True)
    files = sorted((root / 'data' / 'compare').glob('????-W??.json'))
    with open(out, 'w', newline='') as fh:
        w = csv.DictWriter(fh, COLS); w.writeheader(); n = 0
        for f in files:
            for x in rows(json.loads(f.read_text())): w.writerow(x); n += 1
    return n, len(files)

if __name__ == '__main__':
    a = argparse.ArgumentParser(); a.add_argument('--root', default='.'); x = a.parse_args(); n, k = export(x.root); print(f'{n} rows from {k} weeks')
