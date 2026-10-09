#!/usr/bin/env python3
"""Compare each saved week with the week before it. Rules: docs/WEEKLY_SPEC.md section 7.

Reads data/weekly/*.json (never changes them). Writes one small file per week to
data/compare/<week>.json that the "This week" screens read, plus data/compare/index.json.
Run: python3 scripts/weekly_compare.py
"""
import json, math, pathlib, statistics, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
MIN_DIFF, MIN_SIGMA, FLOOR = 8, 3.0, 8        # count rule
SHARE_SIGMA, SHARE_WEEKS = 3.0, 4             # share rule
NEW_NOW, NEW_BEFORE = 5, 2                    # new domain
WATCH_NOW, WATCH_QUIET_WEEKS = 3, 4           # new watchlist name
SCHEMA = 1


LABELS = {'ai_ml': 'AI and ML', 'cpp': 'C++', 'ai_agents': 'AI agents', 'claude_code': 'Claude Code', 'mcp': 'MCP', 'gpu': 'GPUs',
          'ipo': 'IPO', 'data_center': 'data centers', 'fusion_fission': 'fusion and fission', 'photonics_lidar': 'photonics and lidar',
          'typescript': 'TypeScript', 'javascript': 'JavaScript', 'postgres': 'Postgres', 'sqlite': 'SQLite', 'vscode': 'VS Code',
          'wasm': 'WebAssembly', 'onsite': 'on-site', 'askhn': 'Ask HN'}


def nice(key):
    return LABELS.get(key) or key.replace('_', ' ')


def count_flag(this, last, total_this, total_last):
    """Return (state, expected). state is rose, fell, steady or small. None if last week has no total."""
    if not total_last or not total_this:
        return None, 0.0
    expected = last / total_last * total_this
    if expected < FLOOR and this < FLOOR:
        return 'small', expected
    diff = this - expected
    if abs(diff) >= MIN_DIFF and abs(diff) >= MIN_SIGMA * math.sqrt(max(expected, 1e-9)):
        return ('rose' if diff > 0 else 'fell'), expected
    return 'steady', expected


def share_flag(series):
    """series: share values oldest to newest, last one is this week. Returns (state, avg4, usual_change)."""
    prior = series[:-1]
    if len(prior) < SHARE_WEEKS:
        return 'not_enough_weeks', None, None
    window = prior[-SHARE_WEEKS:]
    avg4 = sum(window) / len(window)
    changes = [b - a for a, b in zip(window, window[1:])]
    usual = statistics.pstdev(changes) if len(changes) >= 2 else abs(changes[0]) if changes else 0.0
    move = series[-1] - prior[-1]
    if usual > 0 and abs(move) > SHARE_SIGMA * usual:
        return ('rose' if move > 0 else 'fell'), avg4, usual
    return 'steady', avg4, usual


def g(d, *path, default=0):
    for p in path:
        if not isinstance(d, dict) or p not in d:
            return default
        d = d[p]
    return d


def total_live(w):
    return g(w, 'shared', 'volume', 'stories_live')


def total_all(w):
    return g(w, 'shared', 'volume', 'stories_all')


# ---- count groups: (audience, group name, getter returning {key: stories}) ----
def groups(w):
    e, v, ge = w.get('engineers', {}), w.get('vcs', {}), w
    out = []
    out.append(('engineers', 'Languages', {k: x.get('stories', 0) for k, x in e.get('languages', {}).items()}))
    out.append(('engineers', 'Tools', {k: x.get('stories', 0) for k, x in e.get('tools', {}).items()}))
    out.append(('engineers', 'AI coding', {k: x.get('stories', 0) for k, x in e.get('ai_coding', {}).items()}))
    out.append(('vcs', 'Deep tech themes', {k: x.get('stories', 0) for k, x in v.get('themes', {}).items()}))
    out.append(('vcs', 'Names', dict(g(v, 'watchlist', 'mentions', default={}))))
    out.append(('vcs', 'Deal words', dict(g(v, 'deal_words', 'by_word', default={}))))
    out.append(('geeks', 'Topics', {k: x.get('stories', 0) for k, x in w.get('baskets', {}).items() if x.get('audience') == 'geeks'}))
    return out


def shares(w):
    """{(audience, key): (label, share)} for the share rule. Denominators are stable per week."""
    live, allst = total_live(w), total_all(w)
    out = {}
    if live:
        out[('engineers', 'ai_share')] = ('AI in story titles and text', g(w, 'shared', 'ai', 'terms', 'core', 'story_live') / live)
        # Titles are needed to tell these stories apart, and dead or deleted stories keep no title: live base.
        out[('engineers', 'show_hn')] = ('Show HN share of stories', g(w, 'engineers', 'show_hn', 'stories') / live)
        out[('geeks', 'ai_free')] = ('Stories with no AI term', g(w, 'geeks', 'ai_free', 'stories') / live)
    if allst:
        out[('shared', 'dead')] = ('Stories dead or deleted', 1 - live / allst)
    linked = g(w, 'geeks', 'variety', 'linked_stories')
    if linked:
        out[('geeks', 'variety')] = ('Distinct sites per linked story', g(w, 'geeks', 'variety', 'distinct_domains') / linked)
    p, q = g(w, 'vcs', 'sources', 'press', 'stories'), g(w, 'vcs', 'sources', 'primary', 'stories')
    if p + q:
        out[('vcs', 'press_share')] = ('Press share of linked stories (press vs primary sources)', p / (p + q))
    return out


def story(r):
    return {'id': r.get('id'), 'title': (r.get('title') or '')[:140], 'domain': r.get('domain') or '', 'points': r.get('points', 0), 'comments': r.get('comments', 0)}


def stories(rows, n):
    return [story(r) for r in (rows or [])[:n]]


def bars(d, key='stories', n=None, small_below=None):
    """small_below: counts under this limit are shown as present or absent only (WEEKLY_SPEC.md), never as a number."""
    rows = sorted(((k, (v.get(key, 0) if isinstance(v, dict) else v)) for k, v in (d or {}).items()), key=lambda r: -r[1])
    out = []
    for k, v in (rows[:n] if n else rows):
        if small_below is not None and v < small_below:
            out.append({'label': nice(k), 'value': 1 if v else 0, 'present_only': True})
        else:
            out.append({'label': nice(k), 'value': v})
    return out


def extras(w):
    """Facts, bars and story lists that sit under the flags on each screen. Scope B, WEEKLY_SPEC.md."""
    disc = g(w, 'shared', 'discussion', default={})
    e = {
        'facts': [
            {'label': 'Stories with 100 or more comments', 'value': disc.get('stories_100_comments', 0)},
            {'label': 'Stories with 100 or more points', 'value': disc.get('stories_100_points', 0)},
            {'label': 'Show HN stories', 'value': g(w, 'engineers', 'show_hn', 'stories')},
            {'label': 'Show HN stories that link to GitHub', 'value': g(w, 'engineers', 'show_hn', 'github')}],
        'bars': [{'title': 'AI coding terms in story titles and text', 'unit': 'stories', 'rows': bars(g(w, 'engineers', 'ai_coding', default={}))},
                 {'title': 'Skills in monthly hiring comments', 'unit': 'comments', 'estimated': True,
                  'note': 'Estimate. ' + str(g(w, 'engineers', 'hiring', 'estimated_posts')) + (' comment looked like a job post' if g(w, 'engineers', 'hiring', 'estimated_posts') == 1 else ' comments looked like job posts')+ ' (first line with 2 or more "|" fields). Not linked to a hiring thread, so a count is not a count of companies.',
                  'rows': bars(g(w, 'engineers', 'hiring', 'skills', default={}), key='')}],
        'lists': [{'title': 'Top Show HN', 'items': stories(g(w, 'engineers', 'show_hn', 'top', default=[]), 3)},
                  {'title': 'Most commented Ask HN', 'items': stories(g(w, 'engineers', 'ask_hn', 'top_by_comments', default=[]), 3)}]}
    v = {
        'facts': [{'label': 'Linked stories from press sites', 'value': g(w, 'vcs', 'sources', 'press', 'stories')},
                  {'label': 'Linked stories from primary sources', 'value': g(w, 'vcs', 'sources', 'primary', 'stories')},
                  {'label': 'Stories with deal words in the title', 'value': g(w, 'vcs', 'deal_words', 'stories')}],
        'bars': [{'title': 'Deep tech themes', 'unit': 'stories', 'rows': bars(g(w, 'vcs', 'themes', default={}), small_below=8)},
                 {'title': 'Deal words in titles', 'unit': 'stories', 'rows': bars(g(w, 'vcs', 'deal_words', 'by_word', default={}), key='')},
                 {'title': 'Names in story titles', 'unit': 'stories', 'rows': bars(g(w, 'vcs', 'watchlist', 'mentions', default={}), key='', n=8),
                  'note': 'Starter list of ' + str(len(g(w, 'vcs', 'watchlist', 'mentions', default={}))) + ' names. A name in a title does not mean the company raised money, owns anything or is hiring.'}],
        'lists': [{'title': 'Top stories with deal words', 'note': 'Hacker News talking, not a deal database.', 'items': stories(g(w, 'vcs', 'deal_words', 'top', default=[]), 3)}]}
    baskets = {k: x for k, x in w.get('baskets', {}).items() if x.get('audience') == 'geeks'}
    ge = {
        'facts': [{'label': 'Stories with no AI term', 'value': g(w, 'geeks', 'ai_free', 'stories')},
                  {'label': 'Stories that mention an old year', 'value': g(w, 'geeks', 'old_year_tag', 'stories')},
                  {'label': 'Different sites among linked stories', 'value': g(w, 'geeks', 'variety', 'distinct_domains')},
                  {'label': 'Links to Wikipedia', 'value': g(w, 'geeks', 'reading', 'wikipedia')},
                  {'label': 'Links to YouTube', 'value': g(w, 'geeks', 'reading', 'youtube')}],
        'bars': [{'title': 'Biggest topics', 'unit': 'stories', 'rows': bars(baskets, n=8)}],
        'lists': [{'title': 'Most debated story with no AI term', 'note': 'Debated means 100 or more comments and more comments than points. It does not mean people agreed or disagreed.',
                   'items': stories(g(w, 'geeks', 'debated_non_ai', default=[]), 3)},
                  {'title': 'Most commented Ask HN', 'items': stories(g(w, 'engineers', 'ask_hn', 'top_by_comments', default=[]), 3)}]}
    top = stories(w.get('top_stories'), 5)
    return {'engineers': e, 'vcs': v, 'geeks': ge}, top


def compare(weeks, i):
    """weeks: list of snapshot dicts oldest first. Compare weeks[i] with weeks[i-1]."""
    w = weeks[i]
    prev = weeks[i - 1] if i > 0 else None
    res = {'schema': SCHEMA, 'week': w['week'] if 'week' in w else w.get('iso'), 'start_utc': w.get('start_utc'),
           'end_exclusive_utc': w.get('end_exclusive_utc'), 'kind': w.get('kind'),
           'prev_week': (prev.get('week') or prev.get('iso')) if prev else None,
           'prior_weeks_saved': i, 'list_version': g(w, 'methods', 'list_version', default=None), 'audiences': {}}
    auds = {a: {'rose': [], 'fell': [], 'new': [], 'small': [], 'shares': []} for a in ('engineers', 'vcs', 'geeks', 'shared')}
    if prev and total_live(w) and total_live(prev):
        pg = {(a, n): d for a, n, d in groups(prev)}
        for a, n, d in groups(w):
            last = pg.get((a, n), {})
            for k, this in d.items():
                st, exp = count_flag(this, last.get(k, 0), total_live(w), total_live(prev))
                row = {'group': n, 'key': k, 'label': nice(k), 'this': this, 'last': last.get(k, 0), 'expected': round(exp, 1)}
                if st in ('rose', 'fell'):
                    row['diff'] = round(this - exp, 1)
                    auds[a][st].append(row)
                elif st == 'small':
                    auds[a]['small'].append(row)
        # new domains
        pd = prev.get('domains', {})
        newd = []
        for dom, (n, pts) in w.get('domains', {}).items():
            before = pd.get(dom, [0, 0])[0]  # only domains with 3+ stories are saved, so a missing one had 2 or fewer
            if n >= NEW_NOW and before <= NEW_BEFORE:
                newd.append({'group': 'Sites', 'key': dom, 'label': dom, 'this': n, 'last_known': dom in pd, 'last': before if dom in pd else None, 'points': pts})
        newd.sort(key=lambda r: -r['this'])
        res['new_domains'] = newd[:5]
        # new watchlist names need 4 quiet weeks
        if i >= WATCH_QUIET_WEEKS:
            quiet = weeks[i - WATCH_QUIET_WEEKS:i]
            for k, now in g(w, 'vcs', 'watchlist', 'mentions', default={}).items():
                if now >= WATCH_NOW and all(g(q, 'vcs', 'watchlist', 'mentions', k, default=0) == 0 for q in quiet):
                    auds['vcs']['new'].append({'group': 'Names', 'key': k, 'label': k, 'this': now, 'last': 0})
    else:
        res['new_domains'] = []
    # shares
    hist = [shares(x) for x in weeks[:i + 1]]
    for key, (label, val) in hist[-1].items():
        series = [h[key][1] for h in hist if key in h]
        st, avg4, usual = share_flag(series)
        auds[key[0]]['shares'].append({'key': key[1], 'label': label, 'this': round(val, 4),
                                        'last': round(series[-2], 4) if len(series) > 1 else None,
                                        'avg4': round(avg4, 4) if avg4 is not None else None,
                                        'usual_change': round(usual, 4) if usual is not None else None, 'state': st})
    for a in auds:
        for k in ('rose', 'fell'):
            auds[a][k].sort(key=lambda r: -abs(r['diff']))
            auds[a][k] = auds[a][k][:3]
        auds[a]['new'] = auds[a]['new'][:5]
        auds[a]['small'] = len(auds[a]['small'])  # only the count is kept: items too small to tell
    ex, top = extras(w)
    for a, x in ex.items():
        auds[a].update(x)
    res['top_stories'] = top
    res['volume'] = {'stories_all': total_all(w), 'stories_live': total_live(w), 'comments_all': g(w, 'shared', 'volume', 'comments_all')}
    res['audiences'] = auds
    return res


def load_weeks(root):
    idx = json.loads((root / 'data/weekly/index.json').read_text())
    weeks = []
    for e in idx['weeks']:
        d = json.loads((root / 'data/weekly' / e['path']).read_text())
        d['week'] = e['week']
        weeks.append(d)
    weeks.sort(key=lambda d: d['start_utc'])
    return weeks


def run(root=ROOT):
    weeks = load_weeks(root)
    out = root / 'data/compare'
    out.mkdir(parents=True, exist_ok=True)
    index = []
    for i, w in enumerate(weeks):
        c = compare(weeks, i)
        (out / (w['week'] + '.json')).write_text(json.dumps(c, separators=(',', ':'), ensure_ascii=False, sort_keys=True))
        index.append(w['week'])
    return index


if __name__ == '__main__':
    print(len(run()), 'weeks compared')
