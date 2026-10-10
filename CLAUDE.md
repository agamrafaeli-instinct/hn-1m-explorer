# Instructions for coding agents

This repo runs on the Flywheel. Read [docs/FLYWHEEL.md](docs/FLYWHEEL.md) first and write issues and comments as in [docs/ISSUES_STYLE.md](docs/ISSUES_STYLE.md).

1. **Work only from the board.** Pick a card in the Ready column of https://github.com/users/agamrafaeli-instinct/projects/1. Ready means go. Do not start items in Grooming, Defined or Needs decision.
2. **Move the card.** Dev when you start, QA when the work is done and checked. Say what you changed in a comment on the issue and name the commit. If you cannot change the board, comment on the issue instead.
3. **New work gets an issue first.** Open one in the style of ISSUES_STYLE.md (neutral wording, no personal names, estimate, acceptance criteria) and link it to its epic. Reference the issue in every commit message, for example "refs #123".
4. **Push safely.** Fetch and rebase before every push. Never force-push. Do not revert or overwrite other people's commits. Prefer a branch and a pull request; the owner merges once the "Hypothesis PR check" is green.
5. **Keep out of data and the daily run.** Do not edit anything under data/ and do not change .github/workflows/daily-hn.yml. A bot commits there every day.
6. **Test.** Run `python3 -m unittest discover -s tests`, `node tests/hypotheses.test.js` before you push. Every card must be an all-time film card (tests/test_film_guard.py).
7. **Public text is public.** No private information, tokens, emails or personal names in code, issues, commits or docs. Claims on the site must be sourced from the data. Use simple words, no em dashes.
8. **Small UI choices** (colors, spacing, copy tweaks) need no approval. Anything about meaning, data or scope goes in a comment on the issue for the owner.
