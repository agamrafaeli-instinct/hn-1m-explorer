#!/usr/bin/env python3
"""Group quiet-then-return curves by shape, burial length and trigger (#288).
Rules: docs/RESURFACING_SPEC.md. Reads the atlas series through scripts/resurfacing.py.
Output: data/resurfacing/groups.json. Numbers only, no conclusion text."""
import json, pathlib, random, statistics, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import resurfacing as R

SHAPE_MIN = 10        # groups smaller than this merge into "other"
SLOW_CLIMB = 6        # months between leaving quiet and reaching 0.5 x A
SHORT_WITHIN = 12     # months after the return to fall back under 0.2 x A
SHUFFLES = 1000
SEED = 285


def ym(m):
    return int(m[:4]) * 12 + int(m[5:]) - 1


def shape_flags(s, A, end_i, ret_i):
    n = len(s)
    flags = []
    window = s[ret_i + 3: ret_i + SHORT_WITHIN + 1]
    determined = ret_i + SHORT_WITHIN < n
    if any(x < R.QUIET_X * A for x in window):
        flags.append('short')
    if s[ret_i] >= A and all(x >= R.ACTIVE_X * A for x in s[ret_i + 1: ret_i + 4]):
        flags.append('sharp')
    if ret_i - (end_i + 1) >= SLOW_CLIMB:
        flags.append('slow')
    return flags, determined


def pick_shape(flags):
    for f in ('short', 'sharp', 'slow'):
        if f in flags:
            return f
    return 'other'


def anniversary(months, counts, totals, start_i, ret_i):
    """True when the return month is within 1 month of a multiple of 12 months after the subject's own peak month."""
    share = [counts[i] / totals[i] if totals[i] else 0 for i in range(start_i)]
    peak_i = max(range(start_i), key=lambda i: share[i])
    d = ret_i - peak_i
    k = round(d / 12)
    return k >= 1 and abs(d - 12 * k) <= 1


def quartiles(v):
    v = sorted(v)
    q = statistics.quantiles(v, n=4, method='inclusive')
    return {'min': v[0], 'q1': q[0], 'median': q[1], 'q3': q[2], 'max': v[-1]}


def main():
    rnd = random.Random(SEED)
    rows = []
    for kind, name, months, counts, totals in R.iter_subjects():
        A, spells = R.detect(months, counts, totals)
        if not spells:
            continue
        s = [counts[i] / totals[i] if totals[i] else 0.0 for i in range(len(months))]
        pos = {m: i for i, m in enumerate(months)}
        for sp in spells:
            if not sp['return_month']:
                continue
            si, ei, ri = pos[sp['start']], pos[sp['end']], pos[sp['return_month']]
            flags, det = shape_flags(s, A, ei, ri)
            ann = anniversary(months, counts, totals, si, ri)
            # shuffled baseline: random return months after the quiet spell, same data window
            base = 0
            lo = si + R.QUIET_MIN
            hi = len(months) - 1
            rows.append({'kind': kind, 'subject': name, 'start': sp['start'], 'return': sp['return_month'],
                         'burial': sp['burial_months'], 'flags': flags, 'shape_known': det,
                         'shape': pick_shape(flags), 'anniversary': ann,
                         '_peak_args': (months, counts, totals, si, lo, hi)})
    # baseline
    hits = []
    for _ in range(SHUFFLES):
        h = 0
        for r in rows:
            months, counts, totals, si, lo, hi = r['_peak_args']
            if lo > hi:
                continue
            h += anniversary(months, counts, totals, si, rnd.randint(lo, hi))
        hits.append(h / len(rows))
    hits.sort()
    obs = sum(r['anniversary'] for r in rows) / len(rows)
    for r in rows:
        del r['_peak_args']
    shapes = {}
    for r in rows:
        shapes[r['shape']] = shapes.get(r['shape'], 0) + 1
    merged, small = {}, []
    for k, v in shapes.items():
        if v < SHAPE_MIN and k != 'other':
            small.append(k)
            merged['other'] = merged.get('other', 0) + v
        else:
            merged[k] = merged.get(k, 0) + v
    bur = [r['burial'] for r in rows]
    bins = {}
    for b in bur:
        k = f'{(b // 12) * 1}-{(b // 12) + 1} years' if b < 120 else '10+ years'
        bins[k] = bins.get(k, 0) + 1
    q = quartiles(bur)
    out = {
        'spec': 'docs/RESURFACING_SPEC.md', 'caveat': 'Story counts and shares, not points.',
        'returns': len(rows), 'by_kind': {k: sum(1 for r in rows if r['kind'] == k) for k in ('term', 'domain')},
        'shapes': merged, 'shapes_unmerged': shapes, 'small_groups_merged_into_other': small,
        'shape_flags': {f: sum(1 for r in rows if f in r['flags']) for f in ('sharp', 'slow', 'short')},
        'shape_not_yet_known': sum(1 for r in rows if not r['shape_known']),
        'burial_months': {**q, 'iqr_years': round((q['q3'] - q['q1']) / 12, 2)},
        'burial_by_year_bins': dict(sorted(bins.items(), key=lambda kv: int(kv[0].split('-')[0].rstrip('+ years').split()[0]) if kv[0][0].isdigit() else 99)),
        'anniversary': {'observed_share': round(obs, 4), 'baseline_p5': round(hits[int(.05 * SHUFFLES)], 4),
                        'baseline_median': round(hits[SHUFFLES // 2], 4), 'baseline_p95': round(hits[int(.95 * SHUFFLES) - 1], 4),
                        'shuffles': SHUFFLES, 'seed': SEED},
        'triggers_not_testable': {'neighbour': 'no relation data between terms in the archive aggregates',
                                  'outside_event': 'needs a dated source for each return; not in the aggregates'},
        'no_pattern_checks': {'fewer_than_30_returns': len(rows) < 30,
                              'anniversary_inside_baseline_5_95': hits[int(.05 * SHUFFLES)] <= obs <= hits[int(.95 * SHUFFLES) - 1],
                              'largest_shape_share': round(max(merged.values()) / len(rows), 3),
                              'burial_iqr_over_5_years': (q['q3'] - q['q1']) / 12 > 5},
        'never_quiet': json.load(open(R.ROOT / 'data/resurfacing/curves.json'))['never_quiet'].__len__(),
        'returns_list': rows,
    }
    (R.ROOT / 'data/resurfacing/groups.json').write_text(json.dumps(out, separators=(',', ':')))
    print({k: v for k, v in out.items() if k != 'returns_list'})


if __name__ == '__main__':
    main()
