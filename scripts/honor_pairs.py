#!/usr/bin/env python3
"""Write the Honor upgrade cards of #133 (docs/HONOR_SPEC.md). Each new card compares two theme groups from data/film_shares.json
on one measure per story over all months: points (p), comments (c) or ten-point hits (h). Thresholds are the ones used on h370 and
were set before any card was run. Old cards are never touched. Usage: honor_pairs.py [first_new_id_number]"""
import json, sys, re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
T = json.loads((ROOT / 'data/film_shares.json').read_text())['terms']
# old card id, A, B, measure
PAIRS = [
 ('h301','agents','gpt','p'),('h302','sql','nosql','p'),('h303','dist','oldguard','p'),('h305','newfe','syslang','p'),
 ('h306','infra','syslang','p'),('h307','oldguard','tinker','p'),('h308','aicode','llm','p'),('h310','tinker','maint','p'),
 ('h311','syslang','go','p'),('h312','maint','aicode','p'),('h313','llm','agents','p'),('h315','go','python','p'),
 ('h316','kubernetes','java','p'),('h317','vue','react','p'),('h318','java','python','p'),('h319','vcdc','vcgpu','p'),
 ('h320','vcdc','vcaero','p'),('h322','vcgpu','vcnb','p'),('h324','vcnb','vcrob','p'),('h326','vcaero','vcsol','p'),
 ('h328','vcsol','vcdc','p'),('h330','vcrob','vcgpu','p'),('h332','vcall','aicode','p'),
 ('h339','cu_space','cu_games','h'),('h340','cu_animals','cu_food','p'),('h342','cu_music','cu_books','c'),
 ('h346','cu_education','cu_diy','h'),('h348','cu_books','cu_art','p'),('h349','cu_art','cu_music','p'),('h350','cu_maps','cu_space','h'),
 ('h353','cu_questions','gk_showhn','c'),('h354','gk_weird','gk_science','p'),('h355','gk_weird','gk_history','h'),
 ('h356','gk_weird','gk_retro','c'),('h360','gk_science','gk_history','p'),('h362','gk_retro','gk_puzzle','p'),
 ('h364','gk_history','cu_books','p'),('h365','gk_puzzle','cu_music','p'),('h367','gk_showhn','cu_diy','p'),
 ('h368','gk_boring','gk_showhn','p'),
]
M = {'p': ('points', 'points per story', 'more points'), 'c': ('comments', 'comments per story', 'more comments'),
     'h': ('hits', 'share of stories that reach ten points', 'a higher ten-point rate')}
VERD = [{"when": {"op": ">=", "value": 1.5}, "verdict": "supported", "confidence": "strong"},
        {"when": {"op": ">=", "value": 1.1}, "verdict": "supported", "confidence": "weak"},
        {"when": {"op": "<=", "value": 0.9}, "verdict": "refuted", "confidence": "strong"},
        {"else": True, "verdict": "inconclusive", "confidence": "inconclusive"}]

def lab(k):
    s = T[k]['label']; return s if s[:1].isupper() or s[:2] in ('GP',) else s

def card(num, old, a, b, m, audience):
    la, lb = lab(a), lab(b)
    mk = {'p': '_p', 'c': '_c', 'h': '_h'}[m]
    word, per, win = M[m]
    cid = 'h%d' % num
    gen = {'p': 'gets more points', 'c': 'gets more comments', 'h': 'reaches ten points more often'}[m]
    def grp(k, name): return {"label": name + " ({from} to {to})", "indices": "all", "field": k + mk, "per": k + '_s'}
    return cid, {
     "schema": 1, "id": cid, "replaces": old,
     "title": "%s stories vs %s stories on %s" % (la[:1].upper() + la[1:], lb, word),
     "author": "film-cards", "audience": audience,
     "hypothesis": "A story about %s %s than a story about %s." % (la, gen, lb),
     "expect": "If true, %s for %s stories should be at least 1.5x the value for %s stories, over all stories from 2006 to 2026 (1.1x is weak, 0.9x or lower refutes it)." % (per, la, lb),
     "check": {"source": "data/film_shares.json", "path": "monthly", "label_field": "month", "stat": "pooled_share_ratio", "unit": "x",
               "field": a + mk, "per_label": per + ", " + la + " against " + lb, "display_pct": False,
               "group_a": grp(a, la[:1].upper() + la[1:] + " stories"), "group_b": grp(b, lb[:1].upper() + lb[1:] + " stories")},
     "verdicts": VERD,
     "thresholds_note": "Thresholds are the ones used on h370, set before this card was run and not tuned to its result. %s is left unchanged." % old,
     "caveats": ["Points are the score each story had when the archive fetched it, so 2025 and 2026 stories may still be gaining points.",
                 "A title that names a theme is not proof the story is about it, and one story can sit in both groups.",
                 "Both groups are title words only, so stories that never name the theme are missed.",
                 "%s asked a different question; this card compares two groups head to head." % old]}

def main():
    first = int(sys.argv[1]) if len(sys.argv) > 1 else 380
    honor = {c['id']: c for c in json.loads((ROOT / 'data/honor.json').read_text())['cards']}
    n = first
    for old, a, b, m in PAIRS:
        cid, c = card(n, old, a, b, m, honor[old]['audience'])
        slug = re.sub(r'[^a-z0-9]+', '-', ('%s-vs-%s-%s' % (a, b, M[m][0])).lower())
        (ROOT / 'hypotheses' / ('%s-%s.json' % (cid, slug))).write_text(json.dumps(c, indent=1) + '\n')
        print(cid, old, a, b, m); n += 1

if __name__ == '__main__':
    main()
