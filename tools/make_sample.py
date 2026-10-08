# Generates SYNTHETIC sample data (sample/) in the same shape as the real data, incl. summary.concentration.
import csv, json, math, random, datetime, collections, re
random.seed(7)
N = 60000
STOP = set('a an the of to in on for and or with is are was how why what i my your you we it this that at by from as be do not can new'.split())
WORDS = 'rust python llm sql linux apple google startup security privacy database web browser api open source ai gpu kernel postgres compiler javascript typescript show hn ask launch tool library paper physics math book history money law space climate chip energy cloud'.split()
DOM = ['github.com','nytimes.com','arxiv.org','youtube.com','medium.com','blog.example.org','wikipedia.org','twitter.com','bloomberg.com','substack.com','theverge.com','bbc.com']
nauth = 4000
aw = [1 / (i + 1) ** 1.05 for i in range(nauth)]
auth = ['user%d' % i for i in range(nauth)]
dw = [1 / (i + 1) ** 0.9 for i in range(len(DOM))]
hourw = [3,2.5,2.2,2,2,2.3,3,4.5,6,7.5,8,8.5,8.7,9,9,8.5,8,7,6,5,4.3,4,3.6,3.2]
wdw = [1.15,1.2,1.2,1.15,1.0,.65,.7]
end = 1759999420; t = end
rows = []
for i in range(N):
    t -= random.randint(400, 1600) * 1
    tt = t
    d = datetime.datetime.utcfromtimestamp(tt)
    # thin by hour/weekday pattern
    a = random.choices(range(nauth), aw)[0]
    dom = random.choices(range(len(DOM)), dw)[0] if random.random() > .22 else None
    base = random.paretovariate(1.15) - 1
    score = int(base * 6 * (hourw[(d.hour + 8) % 24] / 8) ** 1.5 * wdw[d.weekday()] ** 2 * (1.8 if dom in (0, 2) else 1) * (1.5 if a < 40 else 1)) + (1 if random.random() > .35 else 0)
    com = int(score * random.random() * 0.9) if score > 1 else int(random.random() < .3)
    title = ' '.join(random.sample(WORDS, random.randint(2, 5)))
    if random.random() < .1: title = 'Show HN: ' + title
    if random.random() < .06: title = 'Ask HN: ' + title
    typ = 'story'
    rows.append([1000000 + (N - i), typ, auth[a], tt, title, ('https://%s/p/%d' % (DOM[dom], i)) if dom is not None else '', DOM[dom] if dom is not None else '', score, com])
rows = rows
CH = 20000
chunks = []
for c in range(3):
    with open('sample/part-%d.csv' % c, 'w', newline='') as f:
        w = csv.writer(f); w.writerow(['id','type','by','time','title','url','domain','score','descendants']); w.writerows(rows[c*CH:(c+1)*CH])
    chunks.append({'path': 'part-%d.csv' % c, 'rows': CH})
json.dump({'sample': True, 'chunks': chunks}, open('sample/manifest.json', 'w'))

def gini(v):
    v = sorted(v); n = len(v); s = sum(v)
    if not s: return 0
    return sum((2 * (i + 1) - n - 1) * x for i, x in enumerate(v)) / (n * s)
def lorenz(v):
    v = sorted(v, reverse=True); n = len(v); s = sum(v) or 1
    cum = []; c = 0
    for x in v: c += x; cum.append(c / s)
    xs = sorted(set([min(n - 1, int(round(10 ** (math.log10(1/n) + (0 - math.log10(1/n)) * k / 80))) - 1) for k in range(81)] + [0, n - 1]))
    xs = [max(0, x) for x in xs]
    return [[round((i + 1) / n, 6), round(cum[i], 5)] for i in sorted(set(xs))]
def ent(key):
    g = collections.defaultdict(lambda: [0, 0, 0])
    for r in rows:
        ks = key(r)
        for k in ks:
            if not k: continue
            e = g[k]; e[0] += 1; e[1] += r[7]; e[2] += r[8]
    names = list(g)
    return {'count': len(names), 'gini_points': round(gini([g[k][1] for k in names]), 4), 'gini_posts': round(gini([g[k][0] for k in names]), 4),
        'lorenz_points': lorenz([g[k][1] for k in names]), 'lorenz_posts': lorenz([g[k][0] for k in names]),
        'top': [{'name': k, 'posts': g[k][0], 'points': g[k][1], 'comments': g[k][2]} for k in sorted(names, key=lambda k: -g[k][1])[:50]]}
def words(r):
    return set(w for w in re.findall(r"[a-z][a-z']+", r[4].lower()) if w not in STOP and len(w) > 2)
pts = [r[7] for r in rows]; cms = [r[8] for r in rows]
def topshare(v, f):
    v = sorted(v, reverse=True); k = max(1, int(len(v) * f)); return round(sum(v[:k]) / (sum(v) or 1), 4)
hist = collections.defaultdict(lambda: [0, 0])
for s in pts:
    b = 0 if s == 0 else int(math.log2(s)) + 1
    hist[b][0] += 1; hist[b][1] += s
cyc = {'hour': [{'posts':0,'points':0,'comments':0} for _ in range(24)], 'weekday': [{'posts':0,'points':0,'comments':0} for _ in range(7)], 'month': [{'posts':0,'points':0,'comments':0} for _ in range(12)]}
hw = [[0]*24 for _ in range(7)]
for r in rows:
    d = datetime.datetime.utcfromtimestamp(r[3])
    for k, i in (('hour', d.hour), ('weekday', d.weekday()), ('month', d.month - 1)):
        cyc[k][i]['posts'] += 1; cyc[k][i]['points'] += r[7]; cyc[k][i]['comments'] += r[8]
    hw[d.weekday()][d.hour] += r[7]
cyc['hourweek'] = hw
mon = collections.OrderedDict()
for r in rows:
    m = datetime.datetime.utcfromtimestamp(r[3]).strftime('%Y-%m'); d = mon.setdefault(m, [0,0,0]); d[0]+=1; d[1]+=r[7]; d[2]+=r[8]
tp = sorted(rows, key=lambda r: -r[7])[:100]
S = {'schema_version': 1, 'sample': True, 'totals': {'posts': N}, 'type_counts': {'story': N},
 'monthly': [{'month': m, 'posts': v[0], 'score_sum': v[1], 'comments_sum': v[2]} for m, v in sorted(mon.items())],
 'top_posts': [dict(zip(('id','type','by','time','title','url','domain','score','descendants'), r)) for r in tp],
 'time_range': {'min': rows[-1][3], 'max': rows[0][3]},
 'concentration': {'totals': {'posts': N, 'points': sum(pts), 'comments': sum(cms)},
  'entities': {'author': ent(lambda r: [r[2]]), 'domain': ent(lambda r: [r[6]]), 'word': ent(words)},
  'posts': {'lorenz_points': lorenz(pts), 'lorenz_comments': lorenz(cms), 'top_share_points': {str(f): topshare(pts, f) for f in (.001,.01,.1)}, 'top_share_comments': {str(f): topshare(cms, f) for f in (.001,.01,.1)},
    'zero_score_share': round(sum(1 for s in pts if s == 0) / N, 4), 'zero_comment_share': round(sum(1 for s in cms if s == 0) / N, 4),
    'score_hist': [{'lo': 0 if b == 0 else 2 ** (b - 1), 'hi': 0 if b == 0 else 2 ** b - 1, 'posts': v[0], 'points': v[1]} for b, v in sorted(hist.items())]},
  'cyclic': cyc, 'type': {'story': {'posts': N, 'points': sum(pts), 'comments': sum(cms)}}}}
S['top_domains'] = [{'domain': x['name'], 'posts': x['posts']} for x in S['concentration']['entities']['domain']['top']]
S['top_authors'] = [{'by': x['name'], 'posts': x['posts']} for x in S['concentration']['entities']['author']['top']]
json.dump(S, open('sample/summary.json', 'w'))
c = S['concentration']['posts']
print(c['top_share_points'], c['zero_score_share'], S['concentration']['entities']['author']['gini_points'])
