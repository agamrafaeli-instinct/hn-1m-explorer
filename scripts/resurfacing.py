#!/usr/bin/env python3
"""Find quiet-then-return curves. Rules are fixed in docs/RESURFACING_SPEC.md (#286).
Series: title terms (data/atlas/terms-*.json) and top domains (data/atlas/tops-YYYY.json).
Share s(m) = subject stories in month / live stories held in month (data/atlas/months.json, stories_held).
Output: data/resurfacing/curves.json. Counts, not points."""
import glob, json, pathlib, statistics, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
QUIET_MIN = 12      # months in a quiet spell
ACTIVE_BEFORE = 12  # active months needed before a quiet spell (cumulative)
QUIET_X = 0.2       # quiet: share below this x A
ACTIVE_X = 0.5      # active / return: share at or above this x A
RETURN_RUN = 3      # months in a row at or above ACTIVE_X x A
MIN_TOTAL = 60      # stories over the archive
MIN_ACTIVE_MONTHS = 12  # months with 3 or more stories


def months_between(a, b):
    return (int(b[:4]) - int(a[:4])) * 12 + int(b[5:]) - int(a[5:])


def detect(months, counts, totals):
    """months: ordered 'YYYY-MM' list, consecutive. counts/totals: aligned lists.
    Returns (A, spells). Each spell: start, end (last quiet month), return_month or None, burial, levels."""
    n = len(months)
    s = [counts[i] / totals[i] if totals[i] else 0.0 for i in range(n)]
    years = {}
    for i, m in enumerate(months):
        c, t = years.get(m[:4], (0, 0))
        years[m[:4]] = (c + counts[i], t + totals[i])
    peak = max((c / t for c, t in years.values() if t), default=0.0)
    if peak <= 0:
        return 0.0, []
    hi = [x for x in s if x >= ACTIVE_X * peak]
    A = statistics.median(hi) if hi else 0.0
    if A <= 0:
        return 0.0, []
    quiet = [x < QUIET_X * A for x in s]
    active = [x >= ACTIVE_X * A for x in s]
    spells = []
    i = 0
    while i < n:
        if not quiet[i]:
            i += 1
            continue
        j = i
        while j < n and quiet[j]:
            j += 1
        # run is months[i:j]
        if j - i >= QUIET_MIN and sum(active[:i]) >= ACTIVE_BEFORE:
            ret = None
            k = j
            while k + RETURN_RUN <= n:
                if all(active[k:k + RETURN_RUN]):
                    ret = k
                    break
                k += 1
            # a return must come before another qualifying quiet spell starts
            spells.append({'start': months[i], 'end': months[j - 1], 'quiet_months': j - i,
                           'return_month': months[ret] if ret is not None else None,
                           'burial_months': (ret - i) if ret is not None else None,
                           'return_share': round(s[ret], 6) if ret is not None else None})
        i = j
    # drop a return that lies beyond the next spell's start
    for a, b in zip(spells, spells[1:]):
        if a['return_month'] and a['return_month'] > b['start']:
            a['return_month'] = a['burial_months'] = a['return_share'] = None
    return A, spells


def eligible(counts):
    return sum(counts) >= MIN_TOTAL and sum(1 for c in counts if c >= 3) >= MIN_ACTIVE_MONTHS


def load_totals():
    ms = json.load(open(ROOT / 'data/atlas/months.json'))['months']
    ms = [m for m in ms if m['stories'] > 0]  # drops the partial newest month
    return [m['month'] for m in ms], [m['stories_held'] for m in ms]


def month_list(first, last):
    out, y, m = [], int(first[:4]), int(first[5:])
    while f'{y}-{m:02d}' <= last:
        out.append(f'{y}-{m:02d}')
        m += 1
        if m > 12:
            y, m = y + 1, 1
    return out


def iter_subjects():
    """Yield (kind, name, months, counts, totals) for each eligible, old-enough subject, trimmed to its first month."""
    months, totals = load_totals()
    idx = {m: i for i, m in enumerate(months)}
    def one(kind, name, by_month):
        counts = [0] * len(months)
        for m, c in by_month.items():
            if m in idx:
                counts[idx[m]] += c
        if not eligible(counts):
            return None
        first = next(i for i, c in enumerate(counts) if c)
        if len(months) - first < 36:
            return None
        return (kind, name, months[first:], counts[first:], totals[first:])
    for f in sorted(glob.glob(str(ROOT / 'data/atlas/terms-*.json'))):
        for term, by_month in json.load(open(f))['terms'].items():
            r = one('term', term, by_month)
            if r:
                yield r
    dom = {}
    for f in sorted(glob.glob(str(ROOT / 'data/atlas/tops-*.json'))):
        for m, v in json.load(open(f))['months'].items():
            for d, c in v.get('top_domains', []):
                dom.setdefault(d, {})[m] = c
    for d, by_month in dom.items():
        r = one('domain', d, by_month)
        if r:
            yield r


def run():
    months, totals = load_totals()
    idx = {m: i for i, m in enumerate(months)}
    curves, never, young, seen = [], [], [], {'term': 0, 'domain': 0}

    def handle(kind, name, by_month):
        counts = [0] * len(months)
        for m, c in by_month.items():
            if m in idx:
                counts[idx[m]] += c
        if not eligible(counts):
            return
        seen[kind] += 1
        first = next(i for i, c in enumerate(counts) if c)
        if len(months) - first < 36:
            young.append({'kind': kind, 'subject': name})
            return
        A, spells = detect(months[first:], counts[first:], totals[first:])
        if spells:
            for sp in spells:
                curves.append({'kind': kind, 'subject': name, 'active_share': round(A, 6), **sp})
        else:
            never.append({'kind': kind, 'subject': name})

    for f in sorted(glob.glob(str(ROOT / 'data/atlas/terms-*.json'))):
        for term, by_month in json.load(open(f))['terms'].items():
            handle('term', term, by_month)
    dom = {}
    for f in sorted(glob.glob(str(ROOT / 'data/atlas/tops-*.json'))):
        for m, v in json.load(open(f))['months'].items():
            for d, c in v.get('top_domains', []):
                dom.setdefault(d, {})[m] = c
    for d, by_month in dom.items():
        handle('domain', d, by_month)
    out = {'spec': 'docs/RESURFACING_SPEC.md', 'range': [months[0], months[-1]],
           'rules': {'quiet_min_months': QUIET_MIN, 'active_before': ACTIVE_BEFORE, 'quiet_x': QUIET_X,
                     'active_x': ACTIVE_X, 'return_run': RETURN_RUN, 'min_total': MIN_TOTAL},
           'caveat': 'Story counts and shares, not points. Domain series come from the monthly top lists only.',
           'eligible': seen, 'returned': sum(1 for c in curves if c['return_month']),
           'open_spells': sum(1 for c in curves if not c['return_month']),
           'curves': curves, 'never_quiet': never, 'too_young': young}
    p = ROOT / 'data/resurfacing/curves.json'
    p.parent.mkdir(exist_ok=True)
    p.write_text(json.dumps(out, separators=(',', ':')))
    print('eligible', seen, 'curves', len(curves), 'returned', out['returned'], 'open', out['open_spells'],
          'never quiet', len(never), 'young', len(young))


if __name__ == '__main__':
    run()
