# Hacker News Explorer

<!-- last-closed -->Last closed task: [#152](https://github.com/agamrafaeli-instinct/hn-1m-explorer/issues/152) All-time pilot: five terms, old window against all-time, Oct 10, 6:46 PM (UTC+7). Live board: https://agamrafaeli-instinct.github.io/grandstand/<!-- /last-closed -->

**Everyone has a theory about Hacker News. Bring yours.**

Has the conversation shifted from chatbots to agents? Is Kubernetes losing mindshare? Do strange little side projects get more attention than serious technology?

Hacker News Explorer turns those questions into something you can inspect: charts, explicit tests, and the stories behind the numbers.

Explore a rolling window of the **newest HN items**, browse **80 hypothesis cards**, or catch up on what changed this week. Built for your phone. Runs in your browser. No account required.

**[Explore the site →](https://agamrafaeli-instinct.github.io/hn-1m-explorer/)** · [This week](https://agamrafaeli-instinct.github.io/hn-1m-explorer/#/w/engineers) · [Tested hypotheses](https://agamrafaeli-instinct.github.io/hn-1m-explorer/#/hypotheses) · [Bring a hypothesis](CONTRIBUTING.md)

## Start with a question

Pick something you have an opinion about. Read the prediction, inspect the check, and see whether the result survives.

| Your hunch | Open the test |
| --- | --- |
| “Everyone moved from chatbots to agents.” | [Did the conversation actually shift?](https://agamrafaeli-instinct.github.io/hn-1m-explorer/#/c/h301/engineers) |
| “People are tired of React.” | [Is React losing its share of the conversation?](https://agamrafaeli-instinct.github.io/hn-1m-explorer/#/c/h304/engineers) |
| “HN loves weird stuff.” | [Does the advantage survive removing the biggest hits?](https://agamrafaeli-instinct.github.io/hn-1m-explorer/#/c/h121/geeks) |
| “Deep-tech buzz comes from the same few websites.” | [How much attention comes from outside the top five domains?](https://agamrafaeli-instinct.github.io/hn-1m-explorer/#/c/h114/vcs) |

**Wrong guesses stay on the page.** That is part of the attraction.

## Three ways to get lost in the data

### 1. Find out what changed this week

Weekly views compare saved weeks, highlight what rose, fell, or appeared, and link back to the stories.

- **[Engineers](https://agamrafaeli-instinct.github.io/hn-1m-explorer/#/w/engineers):** languages, tools, infrastructure, and what people are building with.
- **[Deep-tech investors](https://agamrafaeli-instinct.github.io/hn-1m-explorer/#/w/vcs):** themes, names, and deal language attracting discussion.
- **[Curious readers](https://agamrafaeli-instinct.github.io/hn-1m-explorer/#/w/geeks):** science, oddities, and the world beyond AI.

Move backward through the saved weeks to see whether a change lasts.

### 2. Follow the attention

The [visual story](https://agamrafaeli-instinct.github.io/hn-1m-explorer/#/story) explores how attention concentrates across stories, authors, domains, title words, and time.

Scroll through concentration curves, an attention clock, weekday heatmaps, and the highest-scoring posts. See what changes when you count submissions, points, or comments.

### 3. Ask your own questions

The [Explorer](https://agamrafaeli-instinct.github.io/hn-1m-explorer/#/explore) lets you choose how much data to load, search titles, and filter by author, domain, date, item type, and minimum score.

Charts and rankings follow your filters. Switch the lens from authors to domains to time of day. Sort the results by score, discussion, or recency, then open the original HN thread.

The summaries load separately from the raw CSV files, so browsing the findings does not require downloading the entire dataset.

## A hypothesis has to be able to lose

Each card records:

1. **The guess:** a claim about Hacker News.
2. **The expectation:** what the data should show if it holds.
3. **The check:** a data source, comparison, and numeric thresholds.
4. **The verdict:** supported, refuted, or inconclusive, computed from those rules.
5. **The caveats:** what the test can and cannot tell you.

The same JavaScript evaluator runs in the browser and in Node.js. You can inspect the [card format](HYPOTHESES.md), read the [evaluator](hyp-eval.js), and reproduce the result.

Some existing cards are exploratory: their authors had seen earlier summaries before fixing thresholds. Cards disclose these limits. “Strong” and “weak” describe a card's declared rules, not statistical confidence intervals.

## What is in the dataset?

| Layer | What it contains |
| --- | --- |
| Recent items | A rolling window of the newest items from the official HN API, including stories, comments, jobs, and polls. |
| Historical summaries | Daily totals from December 2022, plus topic-specific historical series. Coverage varies by dataset. |
| Weekly snapshots | Saved complete UTC weeks and comparisons, with reconstructed weeks labeled. |
| Hypotheses | 80 JSON cards with explicit checks and verdict rules. Some use refreshing data; others use fixed historical windows. |

Counts above reflect the repository on **9 October 2026**. The [manifest](data/manifest.json) records the current item count, chunk metadata, and provenance; individual datasets and cards define their own time coverage.

Most **items** are comments, not stories. Scores and discussion counts are snapshots taken at collection time. Keyword matches are imperfect, and attention on HN does not establish adoption or commercial success.

For exact fields and reproduction details, see the [data schema](DATA_SCHEMA.md) and [weekly methodology](docs/WEEKLY_SPEC.md).

## Run it locally

Use **Python 3.12+** and **Node.js 22+**, matching the project's CI setup. No npm install or frontend bundler is required.

```sh
git clone --depth 1 https://github.com/agamrafaeli-instinct/hn-1m-explorer.git
cd hn-1m-explorer

python3 scripts/stage_site.py --output _site
python3 -m http.server 8000 --directory _site
```

Open **[localhost:8000](http://localhost:8000)**.

Staging generates the hypothesis index, bundle, and tally used by the site. The output directory must be fresh; choose a new directory when staging again. The repository includes the raw dataset, currently about 346 MB of CSV before compression.

To run the data and hypothesis checks:

```sh
python3 -m unittest discover -s tests -v
node tests/hypotheses.test.js
node tests/old_cards.test.js
```

## Under the hood

The interface is plain HTML, CSS, and JavaScript, with Chart.js and Papa Parse loaded for the Explorer. Python scripts collect and summarize the data; GitHub Actions schedules daily updates and weekly snapshots, then publishes static files to GitHub Pages.

| If you want to change… | Start here |
| --- | --- |
| Search, filters, and explorer charts | [app.js](app.js) |
| The scrolling visual story | [story.js](story.js) |
| Weekly comparisons and their display | [scripts/weekly_compare.py](scripts/weekly_compare.py), [weekly.js](weekly.js) |
| Hypothesis rules and rendering | [hyp-eval.js](hyp-eval.js), [hypotheses.js](hypotheses.js) |
| Collection and saved weeks | [scripts/update_daily.py](scripts/update_daily.py), [scripts/weekly_snapshot.py](scripts/weekly_snapshot.py) |

The next ambition is a longer memory: browsable verdict histories, short editorial findings, and an Explorer that reaches beyond the recent window. The [roadmap](ROADMAP.md), [full-archive architecture plan](docs/ARCHITECTURE_ATLAS.md), and [project board](https://github.com/users/agamrafaeli-instinct/projects/1) track that work. Some roadmap checklists may lag the implementation.

## Bring a theory worth testing

You can contribute a hypothesis as a single JSON file.

Copy an existing card, state the prediction, and define what would refute it **before** running the check. Then open a pull request with that card. The [contribution guide](CONTRIBUTING.md) walks through the process.

For larger changes, start with the [board](https://github.com/users/agamrafaeli-instinct/projects/1), [issue-writing guide](docs/ISSUES_STYLE.md), and [development workflow](docs/FLYWHEEL.md).

**What do you think is happening on Hacker News—and what result would change your mind?**

