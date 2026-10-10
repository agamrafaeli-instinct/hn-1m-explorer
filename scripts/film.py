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
 'js': ('JavaScript', r'\b(javascript|js)\b'),
 'sql': ('Postgres, SQLite and DuckDB', r'\b(postgres(ql)?|sqlite|duckdb)\b'),
 'nosql': ('MongoDB and MySQL', r'\b(mongodb|mysql)\b'),
 'dist': ('microservices and serverless', r'\b(microservices?|serverless)\b'),
 'newfe': ('Next.js, Svelte, Vue, htmx and Tailwind', r'\b(next\.?js|svelte|vue(\.?js)?|htmx|tailwind(css)?)\b'),
 'infra': ('Docker, Kubernetes and Terraform', r'\b(docker|kubernetes|k8s|terraform)\b'),
 'oldguard': ('Java, PHP, Ruby, Rails and JavaScript', r'\b(java|php|ruby|rails|javascript)\b'),
 'aicode': ('Cursor, Claude Code, MCP, Copilot and Devin', r'\b(cursor|claude code|mcp|copilot|devin)\b'),
 'localdb': ('SQLite and DuckDB', r'\b(sqlite|duckdb)\b'),
 'tinker': ('Git, Linux, Neovim, Nix and VS Code', r'\b(git|linux|neovim|nix|nixos|vs ?code)\b'),
 'syslang': ('Rust, Zig and C++', r'(\brust\b|\bzig\b|(^|[^a-z0-9])c\+\+)'),
 'maint': ('code review and technical debt', r'\b(code reviews?|tech(nical)? debt)\b'),
 'llm': ('LLM, RAG and fine-tuning', r'\b(llms?|rag|fine-?tun\w*)\b'),
 'go': ('Go', r'\b(golang|go (language|lang|programming)|in go)\b'),
 'python': ('Python', r'\bpython\b'),
 'kubernetes': ('Kubernetes', r'\b(kubernetes|k8s)\b'),
 'vue': ('Vue', r'\bvue(\.?js)?\b'),
 'java': ('Java', r'\bjava\b'),
}
def build_shares():
    files = sorted(glob.glob(os.path.join(ROOT, 'data/archive/stories-*.parquet')))
    con = duckdb.connect()
    con.execute("create view s as select * from read_parquet(%s) where title is not null" % json.dumps(files))
    cols = ', '.join("count(*) filter (where regexp_matches(lower(title), '%s')) as %s_s, coalesce(sum(case when regexp_matches(lower(title), '%s') then score end), 0) as %s_p" % (rx.replace("'", "''"), k, rx.replace("'", "''"), k) for k, (_, rx) in TERMS.items())
    q = "select strftime(time at time zone 'UTC', '%%Y-%%m') as month, count(*) as total, coalesce(sum(score), 0) as pts_total, %s from s group by 1 order by 1" % cols
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
def make_card(cid, slug, term, title, hypothesis, expect, strong, weak, refute, audience, author='film-cards', versus=None, kind='share', direction='up'):
    """Write a film card. kind 'share': term share of stories (or term / versus term when versus is set), ratio of the latest 12
    months to the pooled earlier base. kind 'points': points of term stories against the average story of the same months, all months.
    direction 'up' supports on >= thresholds, 'down' supports on <= thresholds (strong, weak, refute are then ratios, refute is a >= value)."""
    label = TERMS[term][0]; per = ('%s_s' % versus) if versus else 'total'
    f = term + '_s'
    if kind == 'points':
        check = {'source': 'data/film_shares.json', 'path': 'monthly', 'label_field': 'month', 'stat': 'points_vs_month_mean', 'unit': 'x',
          'field': term + '_p', 'count_field': term + '_s', 'avg_points': 'pts_total', 'avg_count': 'total', 'per_label': 'points per story against the same-month average',
          'group_a': {'label': label + ' stories ({from} to {to})', 'indices': 'all'}, 'group_b': {'label': 'Average story of the same months ({from} to {to})', 'indices': 'all'}}
    else:
        check = {'source': 'data/film_shares.json', 'path': 'monthly', 'label_field': 'month', 'stat': 'pooled_share_ratio', 'unit': 'x',
          'field': f, 'per_label': (label + ' per ' + TERMS[versus][0] + ' story') if versus else (label + ' share of stories'), 'display_pct': not versus,
          'group_a': {'label': 'Latest 12 months ({from} to {to})', 'indices': {'last': 12}, 'field': f, 'per': per},
          'group_b': {'label': 'All earlier stories ({from} to {to})', 'indices': {'before_last': 12}, 'field': f, 'per': per}}
    if direction == 'up':
        v = [{'when': {'op': '>=', 'value': strong}, 'verdict': 'supported', 'confidence': 'strong'}, {'when': {'op': '>=', 'value': weak}, 'verdict': 'supported', 'confidence': 'weak'},
             {'when': {'op': '<=', 'value': refute}, 'verdict': 'refuted', 'confidence': 'strong'}]
    else:
        v = [{'when': {'op': '<=', 'value': strong}, 'verdict': 'supported', 'confidence': 'strong'}, {'when': {'op': '<=', 'value': weak}, 'verdict': 'supported', 'confidence': 'weak'},
             {'when': {'op': '>=', 'value': refute}, 'verdict': 'refuted', 'confidence': 'strong'}]
    card = {'schema': 1, 'id': cid, 'title': title, 'author': author, 'audience': audience, 'hypothesis': hypothesis, 'expect': expect, 'check': check,
      'verdicts': v + [{'else': True, 'verdict': 'inconclusive', 'confidence': 'inconclusive'}],
      'thresholds_note': 'Exploratory. Thresholds copied from the card this one replaces.'}
    p = os.path.join(ROOT, 'hypotheses', '%s-%s.json' % (cid, slug)); json.dump(card, open(p, 'w'), indent=2); open(p, 'a').write('\n'); return p
if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'shares': build_shares()
    else: print(__doc__)
