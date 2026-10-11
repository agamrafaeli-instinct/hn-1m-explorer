#!/usr/bin/env python3
"""Story finder, step 1 (#176): candidate generators. Writes data/finder/candidates.json. No prose, only evidence.
Input: data/film_shares.json (monthly title counts per term, title matching only). Archive scores are not used.
Windows (all from calendar months in the file):
  latest   the last 12 months
  prior    all months before the latest 12 (pooled)
  peak     the calendar year with the highest share (years with 1000+ stories only), when it is not inside the latest 12 months
  before   the 12 months before the latest 12
Direction of a ratio: up at >= 1.25, down at <= 0.8, flat between (the same thresholds as the Compare pattern rules).
Generators:
  spike          the latest month at least 1.25x the highest month of the 12 months before it
  reversal       latest vs peak year and latest vs prior point in opposite directions
  cross_window   latest vs prior and latest vs before give different directions (up, down or flat), the way the all-time pilot found gpt and typescript
Minimum count: the smaller window (by stories) needs at least MIN_N matches, otherwise the candidate is rejected with a reason.
Spike uses the latest month because the film file is monthly; a 4-week window needs the daily archive and is left for a later task.
"""
import json, os, sys
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
UP, DOWN, MIN_N, MIN_YEAR_TOTAL = 1.25, 0.8, 30, 1000

def win(rows, k):
    n = sum(r[k + '_s'] for r in rows); t = sum(r['total'] for r in rows)
    return {'from': rows[0]['month'], 'to': rows[-1]['month'], 'n': n, 'total': t, 'share': (n / t if t else 0.0)}

def ratio(a, b): return (a['share'] / b['share']) if b['share'] else None
def direction(r): return None if r is None else ('up' if r >= UP else 'down' if r <= DOWN else 'flat')
def enough(a, b):
    small = a if a['total'] <= b['total'] else b
    return small['n'] >= MIN_N

def peak_rows(M, k):
    by = {}
    for m in M: by.setdefault(m['month'][:4], []).append(m)
    best = None
    for y, rows in by.items():
        t = sum(r['total'] for r in rows)
        if t < MIN_YEAR_TOTAL: continue
        s = sum(r[k + '_s'] for r in rows) / t
        if best is None or s > best[0]: best = (s, y, rows)
    return best

def cand(term, label, gen, windows, ratios, note=''):
    return {'term': term, 'label': label, 'generator': gen, 'windows': windows, 'ratios': ratios, 'note': note}

def run(fs):
    M = fs['monthly']; L = M[-12:]; P = M[:-12]; B = M[-24:-12]; out, rej = [], []
    for k, t in fs['terms'].items():
        lab = t['label']; lw, pw, bw = win(L, k), win(P, k), win(B, k)
        # spike
        last = M[-1]; prev = M[-13:-1]
        s_last = last[k + '_s'] / last['total'] if last['total'] else 0.0
        shares = [(m[k + '_s'] / m['total']) for m in prev if m['total']]
        lo, hi = (min(shares), max(shares)) if shares else (0, 0)
        n_last = last[k + '_s']
        if hi and s_last >= UP * hi:
            if n_last >= MIN_N:
                out.append(cand(k, lab, 'spike', {'month': {'from': last['month'], 'to': last['month'], 'n': n_last, 'total': last['total'], 'share': s_last}, 'range_prev_12': {'from': prev[0]['month'], 'to': prev[-1]['month'], 'min': lo, 'max': hi}}, {'month_vs_prev_max': s_last / hi}))
            else: rej.append({'term': k, 'generator': 'spike', 'reason': 'only %d matches in the latest month, need %d' % (n_last, MIN_N)})
        # reversal
        pk = peak_rows(M, k)
        if pk and pk[1] < L[0]['month'][:4]:
            kw = win(pk[2], k); r1, r2 = ratio(lw, kw), ratio(lw, pw); d1, d2 = direction(r1), direction(r2)
            if {d1, d2} == {'up', 'down'}:
                if enough(lw, kw) and enough(lw, pw):
                    out.append(cand(k, lab, 'reversal', {'latest': lw, 'peak': dict(kw, year=pk[1]), 'prior': pw}, {'latest_vs_peak': r1, 'latest_vs_prior': r2}, 'verdict is %s against the peak year and %s against all earlier months' % (d1, d2)))
                else: rej.append({'term': k, 'generator': 'reversal', 'reason': 'fewer than %d matches in the smaller window' % MIN_N})
        # cross window
        r3, r4 = ratio(lw, pw), ratio(lw, bw); d3, d4 = direction(r3), direction(r4)
        if d3 and d4 and d3 != d4:
            if enough(lw, pw) and enough(lw, bw):
                out.append(cand(k, lab, 'cross_window', {'latest': lw, 'prior': pw, 'before': bw}, {'latest_vs_prior': r3, 'latest_vs_before': r4}, 'verdict is %s against all earlier months and %s against the 12 months before' % (d3, d4)))
            else: rej.append({'term': k, 'generator': 'cross_window', 'reason': 'fewer than %d matches in the smaller window' % MIN_N})
    return {'schema': 1, 'source': 'data/film_shares.json', 'latest_month': M[-1]['month'], 'thresholds': {'up': UP, 'down': DOWN, 'min_matches': MIN_N},
            'note': 'Title matching only. Archive scores for 2025-26 are low for all stories, so only ratios are used.', 'candidates': out, 'rejected': rej}

if __name__ == '__main__':
    res = run(json.load(open(os.path.join(R, 'data/film_shares.json'))))
    p = os.path.join(R, 'data/finder/candidates.json'); os.makedirs(os.path.dirname(p), exist_ok=True)
    json.dump(res, open(p, 'w'), indent=1, sort_keys=True)
    print(len(res['candidates']), 'candidates,', len(res['rejected']), 'rejected')
