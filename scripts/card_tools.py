#!/usr/bin/env python3
"""One spec makes everything a film card needs (#249). Used by new_card.py and upgrade_card.py.
Spec fields: id, slug, term, title, hypothesis, expect, strong, weak, refute, audience; optional versus, kind (share, points, comments,
hit, discussion, weekend), direction (up, down), replaces (an older card id), question (the yes/no headline line for docs/CARD_QUESTIONS.md).
create() writes: hypotheses/<id>-<slug>.json, stories/<id>.json and its stories/index.json entry, a docs/CARD_QUESTIONS.md row when a
question is given. The share page and the test coverage need no file: scripts/stage_site.py builds a share page for every card and the
tests loop over every card. Then it runs the Honor scorecard on the new card and fails when any criterion is False."""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
import film, make_stories, honor_scorecard
REQUIRED = ['id', 'slug', 'term', 'title', 'hypothesis', 'expect', 'strong', 'weak', 'refute', 'audience']


def verdict_for(card, root):
    js = "const E=require(%s);const c=%s;const d=require(%s);console.log(E.evaluate(c,d).verdict)" % (
        json.dumps(str(root / 'hyp-eval.js')), json.dumps(card), json.dumps(str(root / 'data/film_shares.json')))
    return subprocess.run(['node', '-e', js], capture_output=True, text=True, check=True).stdout.strip()


def create(spec, root=ROOT):
    root = pathlib.Path(root)
    missing = [k for k in REQUIRED if k not in spec]
    if missing: raise SystemExit('spec is missing: ' + ', '.join(missing))
    cid = spec['id']
    if list((root / 'hypotheses').glob(cid + '-*.json')): raise SystemExit(cid + ' already exists')
    for t in (spec['term'], spec.get('versus')):
        if t and t not in film.TERMS: raise SystemExit('unknown term ' + t)
    if spec.get('replaces') and not list((root / 'hypotheses').glob(spec['replaces'] + '-*.json')): raise SystemExit('replaces unknown card ' + spec['replaces'])
    film.ROOT = str(root); make_stories.ROOT = root
    p = film.make_card(cid, spec['slug'], spec['term'], spec['title'], spec['hypothesis'], spec['expect'], spec['strong'], spec['weak'], spec['refute'],
                       spec['audience'], versus=spec.get('versus'), kind=spec.get('kind', 'share'), direction=spec.get('direction', 'up'))
    card = json.load(open(p))
    if spec.get('replaces'): card['replaces'] = spec['replaces']
    return finish(card, pathlib.Path(p), root, spec.get('question'))


def finish(card, p, root, question=None):
    """Write the card file, its story and index entry, the question row, then score it. Shared by new and upgraded cards."""
    cid = card['id']
    json.dump(card, open(p, 'w'), indent=2); open(p, 'a').write('\n')
    v = verdict_for(card, root)
    st = make_stories.build(card, v)
    sp = root / 'stories' / (cid + '.json'); json.dump(st, open(sp, 'w'), indent=1); open(sp, 'a').write('\n')
    ip = root / 'stories' / 'index.json'; idx = json.load(open(ip)); idx['ids'] = sorted(set(idx['ids']) | {cid}); json.dump(idx, open(ip, 'w'))
    doc = root / 'docs/CARD_QUESTIONS.md'; wrote_q = False
    if question and doc.exists() and ('| %s |' % cid) not in doc.read_text():
        t = doc.read_text().rstrip('\n').split('\n'); last = max(i for i, l in enumerate(t) if l.startswith('| h'))
        t.insert(last + 1, '| %s | %s |' % (cid, question)); doc.write_text('\n'.join(t) + '\n'); wrote_q = True
    res = honor_scorecard.run(str(root)); mine = next(c for c in res['cards'] if c['id'] == cid)
    return {'card': str(p), 'story': str(sp), 'verdict': v, 'question_row': wrote_q, 'honor': mine['criteria'], 'failing': mine['failing']}


def report(out):
    print('card   ', out['card']); print('story  ', out['story']); print('verdict now:', out['verdict'])
    print('question row added' if out['question_row'] else 'no question row (give "question" in the spec to add one)')
    print('honor  ', out['honor']); print('share page and tests: built for every card by stage_site.py and the test loops')
    if out['failing']: print('HONOR FAILS:', out['failing']); sys.exit(1)
