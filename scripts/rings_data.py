#!/usr/bin/env python3
"""Build data/rings.json for the Rings view (docs/RINGS_SPEC.md, #274): per year, theme shares of stories, top domains, story types.
Sources: data/film_shares.json (monthly theme counts), data/atlas/tops-YYYY.json (monthly top domains), data/atlas/months.json (items by type).
Neutral on purpose: it only reports the numbers. Run from the repo root."""
import json, sys
from pathlib import Path
from collections import defaultdict
ROOT = Path(__file__).resolve().parent.parent
THEMES = [('python', 'Python'), ('react', 'React'), ('rust', 'Rust'), ('kubernetes', 'Kubernetes'), ('llm', 'LLMs'),
          ('vcgpu', 'GPUs'), ('cu_space', 'Space'), ('cu_games', 'Games'), ('cu_privacy', 'Privacy'),
          ('cu_health', 'Health'), ('gk_history', 'History'), ('gk_science', 'Science')]

def build(root=ROOT):
    root = Path(root)
    fs = json.loads((root / 'data/film_shares.json').read_text())
    terms = fs['terms']
    by = defaultdict(list)
    for r in fs['monthly']:
        by[int(r['month'][:4])].append(r)
    years = sorted(by)
    out = {'schema': 1, 'built_from': 'scripts/rings_data.py', 'years': years,
           'note': 'Shares are the part of stories whose title names the theme. Scores for 2025 and 2026 are low, so points are not used here. 2006 starts in October and the latest year is partial.',
           'themes': [], 'domains': [], 'types': {}}
    for k, name in THEMES:
        sh = []
        for y in years:
            tot = sum(r['total'] for r in by[y]); sh.append(round(sum(r.get(k + '_s', 0) for r in by[y]) / tot, 5) if tot else 0)
        out['themes'].append({'id': k, 'label': name, 'terms': terms[k]['label'], 'share': sh})
    for y in years:
        p = root / ('data/atlas/tops-%d.json' % y)
        agg = defaultdict(int)
        if p.is_file():
            for m in json.loads(p.read_text())['months'].values():
                for d, n in m.get('top_domains', []):
                    agg[d] += n
        out['domains'].append([[d, n] for d, n in sorted(agg.items(), key=lambda x: -x[1])[:5]])
    mo = json.loads((root / 'data/atlas/months.json').read_text())['months']
    ym = defaultdict(lambda: [0, 0])
    for m in mo:
        y = int(m['month'][:4]); ym[y][0] += m.get('stories', 0); ym[y][1] += m.get('comments', 0)
    sh, q, cps = [], [], []
    for y in years:
        tot = sum(r['total'] for r in by[y])
        sh.append(round(sum(r['gk_showhn_s'] for r in by[y]) / tot, 5) if tot else 0)
        q.append(round(sum(r['cu_questions_s'] for r in by[y]) / tot, 5) if tot else 0)
        s, c = ym[y]; cps.append(round(c / s, 2) if s else 0)
    out['types'] = {'show_hn_share': sh, 'question_share': q, 'comments_per_story': cps}
    return out

if __name__ == '__main__':
    d = build()
    (ROOT / 'data/rings.json').write_text(json.dumps(d, separators=(',', ':')) + '\n')
    print('rings.json', len(d['years']), 'years', len(json.dumps(d)), 'bytes')
