#!/usr/bin/env python3
"""Film cards: all-time versions of the title and score cards.

A film card asks one question of one term: is its share of stories in the latest 12 complete months higher or lower than
its pooled share over every earlier story since 2006? The base window is printed on each card.

Two jobs:
  python3 scripts/film.py shares          -> writes data/film_shares.json (monthly counts per term, from data/archive)
  python3 scripts/film.py card ...        -> see make_card(); writes hypotheses/<id>-<slug>.json

Stories only (comments carry no score and no title). Dead and deleted stories are excluded because the archive holds live
stories only. Archive scores for 2025-26 stories are low for all stories, so cards use ratios, never raw score levels.
"""
import duckdb, glob, json, os, re, sys, datetime as dt
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
# term id -> (label, regex on the lower-cased title). Add terms here; every card names one id.
TERMS = {
 'react': ('React', r'\breact(\.js|js)?\b'),
 'rust': ('Rust', r'\brust\b'),
 'typescript': ('TypeScript', r'\btypescript\b'),
 'agents': ('agents', r'\bagents?\b'),
 'gpt': ('ChatGPT and GPT models', r'\b(chatgpt|gpt-?[0-9a-z.]*)\b'),
}
def build_shares():
    files = sorted(glob.glob(os.path.join(ROOT, 'data/archive/stories-*.parquet')))
    con = duckdb.connect()
    con.execute("create view s as select * from read_parquet(%s) where title is not null" % json.dumps(files))
    cols = ', '.join("count(*) filter (where regexp_matches(lower(title), '%s')) as %s_s" % (rx.replace("'", "''"), k) for k, (_, rx) in TERMS.items())
    q = "select strftime(time at time zone 'UTC', '%%Y-%%m') as month, count(*) as total, %s from s group by 1 order by 1" % cols
    cur = con.execute(q); names = [d[0] for d in cur.description]
    rows = [dict(zip(names, r)) for r in cur.fetchall()]
    rows = rows[:-1] if rows and rows[-1]['month'] == con.execute("select strftime(max(time) at time zone 'UTC', '%Y-%m') from s").fetchone()[0] and _partial(con) else rows
    out = {'note': 'Monthly story counts and title-term matches, live stories from data/archive, UTC months, partial last month dropped. Built by scripts/film.py.',
           'terms': {k: {'label': l, 'pattern': rx} for k, (l, rx) in TERMS.items()}, 'monthly': rows}
    json.dump(out, open(os.path.join(ROOT, 'data/film_shares.json'), 'w'), separators=(',', ':'))
    print('film_shares.json: %d months, %d terms, %s to %s' % (len(rows), len(TERMS), rows[0]['month'], rows[-1]['month']))
def _partial(con):
    # the last month is partial when the newest story is not in the last 2 days of that month
    last = con.execute("select max(time at time zone 'UTC') from s").fetchone()[0]
    nxt = (last.replace(day=28) + dt.timedelta(days=4)).replace(day=1)
    return (nxt - last).days > 1
def make_card(cid, slug, term, title, hypothesis, expect, strong, weak, refute, audience, author='film-cards'):
    """Write a film card. Thresholds are on the ratio latest-12-months share / pooled earlier share."""
    label = TERMS[term][0]
    card = {'schema': 1, 'id': cid, 'title': title, 'author': author, 'audience': audience, 'hypothesis': hypothesis, 'expect': expect,
      'check': {'source': 'data/film_shares.json', 'path': 'monthly', 'label_field': 'month', 'stat': 'pooled_share_ratio', 'unit': 'x',
        'field': term + '_s', 'per_label': label + ' share of stories', 'display_pct': True,
        'group_a': {'label': 'Latest 12 months ({from} to {to})', 'indices': {'last': 12}, 'field': term + '_s', 'per': 'total'},
        'group_b': {'label': 'All earlier stories ({from} to {to})', 'indices': {'before_last': 12}, 'field': term + '_s', 'per': 'total'}},
      'verdicts': [{'when': {'op': '>=', 'value': strong}, 'verdict': 'supported', 'confidence': 'strong'},
                   {'when': {'op': '>=', 'value': weak}, 'verdict': 'supported', 'confidence': 'weak'},
                   {'when': {'op': '<=', 'value': refute}, 'verdict': 'refuted', 'confidence': 'strong'},
                   {'else': True, 'verdict': 'inconclusive', 'confidence': 'inconclusive'}],
      'thresholds_note': 'Exploratory. Thresholds copied from the card this one replaces.'}
    p = os.path.join(ROOT, 'hypotheses', '%s-%s.json' % (cid, slug)); json.dump(card, open(p, 'w'), indent=2); open(p, 'a').write('\n'); return p
if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'shares': build_shares()
    else: print(__doc__)
