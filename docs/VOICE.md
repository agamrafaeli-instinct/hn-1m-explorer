# Voice

How every word on the site sounds. It comes from docs/NARRATIVE.md, which is the source of truth. Decision (2026-10-12): the voice covers every surface, including tools, buttons, labels, form copy and page titles.

## Rules
1. Simple words and short sentences. Say "use", not "utilize"; "fix", not "resolve".
2. Every claim has a source on the page or one tap away. If a number has no source, remove the number.
3. Say "points", never "votes". The archive holds points per story, not each vote.
4. Say "full archive" or "every story since 2006". Never "1M" or "the last million". Only the repo name keeps it.
5. No em dashes. Use a plain dash or a new sentence.
6. No filler: "simply", "just", "powerful", "seamless", "robust", "comprehensive", "leverage", "delve", "crucial", "unlock".
7. No verdict labels (supported, refuted, inconclusive) on any reading surface. The rule result stays in the data, not on the page.
8. Stay neutral on drift versus repeat. Do not write "the taste never changes". Beat text that interprets the data needs the owner's approval.
9. Buttons are verbs ("Load", "Share"). Labels name the thing ("Min score"). Errors say what failed and what to try ("Could not load. Try again").
10. Page titles: "<What it is> | Hacker News posts, explored". Descriptions are one plain sentence with no claim beyond the data.
11. Wrong guesses stay visible. Do not hide or soften them.

## Banned words and phrases (checked by the copy test, #282)
votes, 1M, the last million, em dash, delve, crucial, pivotal, leverage, streamline, holistic, robust, seamless, empower, unlock, "game-changing", "we're excited", "in order to".

## String groups and who owns them
| Surface | Where the strings live | Owner |
|---|---|---|
| Home, the essay (hook, beats, Start anywhere) | index.html `#v_saga`, saga.js | Saga #258 |
| Compare chart home (old home), Topics | index.html `#v_compare`, `#v_topics`, compare.js | Cadence #278 |
| Rings page and its pop-ups | index.html `#v_rings`, rings.js | Rings #272, same rules |
| Card page, card list, share pages, "Go deeper" lists | hypotheses.js, router.js (`deeper`), scripts/build_share_pages.py | Typeset #257 (done) |
| Story (attention) page, "What is a point?" | index.html `#v_story`, story.js | Cadence #278 |
| Method page | index.html `#v_how` | Cadence #278 (#280) |
| Lesson page (how to read trends) | index.html `#v_lesson`, lesson.js | Cadence #278 |
| Week screens | weekly.js | Cadence #278 |
| Explorer: filters, buttons, results, history strip | index.html `#v_explore`, app.js, rowsearch.js, history.js, yearzoom.js | Cadence #278 |
| Lens pages, Today's story | lens.js, finder.js, `#v_lens`, `#v_today` | Cadence #278 |
| Submit a hypothesis (form copy) | index.html `#v_submit` | Cadence #278 |
| Page titles and descriptions | `<title>`, meta description, `SetPageMeta` calls in rings.js, lens.js, weekly.js, finder.js | Cadence #278 (#280) |
| Navigation tabs (Home, Explorer, Submit, Method) | index.html `#tabs` | Cadence #278 |
| Errors and loading text | `textContent =` strings in all .js files | Cadence #278 |

## Known issues found in the inventory
- story.js line 60 says "Readers vote it up". Reword so it matches the "points" rule (Cadence).
- The Rings fine print and Explorer notes about low scores must name 2023 and 2026 (data/saga.json lists the low-score years), not 2025.
- The story cards' Takeaway text still uses "refutes" and "supports". Needs owner-approved wording (Typeset follow-up).
