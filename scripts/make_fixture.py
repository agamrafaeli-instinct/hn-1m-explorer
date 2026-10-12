#!/usr/bin/env python3
"""Builds the small fixed test dataset in tests/fixtures/root (#248).
  python3 scripts/make_fixture.py [--source data/archive] [--out tests/fixtures/root] [--per-month 90]
Takes the same stories for every run: per month, the N stories with the smallest md5 of their id (a fixed sample of the real archive).
Then writes the files the data scripts read (history/daily.csv, atlas) and runs the real scripts on it with HN_ROOT, so film_shares.json,
topic_series.json, rings.json and saga.json are what the pipeline makes from this archive. Tests read the fixture, never live data.
The fixture is checked in. Rebuild only to change the sample; then update the tests that read exact values."""
import argparse, collections, csv, glob, json, os, pathlib, shutil, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

def main():
    a = argparse.ArgumentParser(); a.add_argument('--source', default=str(ROOT / 'data/archive')); a.add_argument('--out', default=str(ROOT / 'tests/fixtures/root'))
    a.add_argument('--per-month', type=int, default=90); args = a.parse_args()
    import duckdb
    out = pathlib.Path(args.out)
    if out.exists(): shutil.rmtree(out)
    (out / 'data/archive').mkdir(parents=True); (out / 'data/history').mkdir(parents=True); (out / 'data/atlas').mkdir(parents=True)
    files = sorted(glob.glob(args.source + '/stories-*.parquet'))
    con = duckdb.connect()
    con.execute("create table s as select type, id, time, title, url, score, descendants from (select *, row_number() over (partition by strftime(time at time zone 'UTC','%%Y-%%m') order by md5(cast(id as varchar))) rn from read_parquet(%s) where title is not null) where rn <= %d" % (json.dumps(files), args.per_month))
    years = [r[0] for r in con.execute("select distinct cast(strftime(time at time zone 'UTC','%Y') as int) y from s order by y").fetchall()]
    for y in years:
        con.execute("copy (select * from s where cast(strftime(time at time zone 'UTC','%%Y') as int)=%d order by id) to '%s' (format parquet, compression zstd)" % (y, out / ('data/archive/stories-%d.parquet' % y)))
    rows = con.execute("select strftime(time at time zone 'UTC','%Y-%m-%d'), count(*), sum(score), sum(coalesce(descendants,0)) from s group by 1 order by 1").fetchall()
    with open(out / 'data/history/daily.csv', 'w', newline='') as f:
        w = csv.writer(f); w.writerow('date,stories,comments,jobs,polls,pollopts,score_sum_stories,comments_sum_stories,dead,deleted,distinct_authors'.split(','))
        for d, n, sc, cm in rows: w.writerow([d, n, cm, 0, 0, 0, sc, cm, 0, 0, n])
    months = con.execute("select strftime(time at time zone 'UTC','%Y-%m'), count(*), sum(coalesce(descendants,0)) from s group by 1 order by 1").fetchall()
    json.dump({'range': [months[0][0], months[-1][0]], 'months': [{'month': m, 'stories': n, 'comments': c} for m, n, c in months]}, open(out / 'data/atlas/months.json', 'w'))
    for y in years:
        tops = collections.defaultdict(collections.Counter)
        for m, host in con.execute("select strftime(time at time zone 'UTC','%%Y-%%m'), regexp_extract(url, 'https?://(?:www\\.)?([^/]+)', 1) from s where url is not null and cast(strftime(time at time zone 'UTC','%%Y') as int)=%d" % y).fetchall():
            if host: tops[m][host] += 1
        json.dump({'year': y, 'months': {m: {'top_domains': c.most_common(10)} for m, c in sorted(tops.items())}}, open(out / ('data/atlas/tops-%d.json' % y), 'w'))
    env = dict(os.environ, HN_ROOT=str(out))
    for s in ('film.py shares', 'build_topic_series.py', 'rings_data.py', 'saga_data.py'):
        subprocess.run([sys.executable, str(ROOT / 'scripts' / s.split()[0])] + s.split()[1:], env=env, check=True)
    print('fixture:', sum(r[1] for r in rows), 'stories,', len(months), 'months,', len(years), 'years ->', out)

if __name__ == '__main__': main()
