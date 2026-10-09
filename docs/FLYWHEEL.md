# The Flywheel

The standing cycle that keeps work moving. Epics feed tasks, tasks feed development, and finished work feeds new epics. Status lives in the board's **Status** field: Defined, Grooming, Ready, Dev, QA, Done, plus Needs decision. Board: https://github.com/users/agamrafaeli-instinct/projects/1. Issue wording follows [ISSUES_STYLE.md](ISSUES_STYLE.md).

## Statuses
| Status | Meaning |
|---|---|
| Defined | An epic with a goal and a "done when" line. No tasks yet. |
| Grooming | The epic is being broken into tasks, or a task is being written up. |
| Ready | A task with acceptance criteria that can be started without asking anything. |
| Dev | Being built. |
| QA | Built and deployed. Being checked (390px screenshots, data checks, load time). |
| Done | Checked and closed. |
| Needs decision | A yes or no is needed from the owner. See below. |

## Rules
1. **Dev picks Ready tasks.** Take the highest Ready task by epic order. Do not start anything that is not Ready.
2. **Keep at least 5 Ready tasks.** Groom the next epic whenever fewer than 5 Ready tasks remain, so dev is never empty.
3. **Every epic gets tasks.** An epic in Defined with no tasks is groomed in order: move it to Grooming, write tasks with acceptance criteria, move each finished task to Ready.
4. **Keep at least 5 Defined epics.** When fewer than 5 remain, define new epics from the vision in ROADMAP.md, from QA findings and from recurring data questions. Each gets a title in the form `[Epic] - <Snazzy Code Name> - What it is in up to seven words` (see ISSUES_STYLE.md), a goal paragraph and a "done when" line. No duplicates of an open or closed epic.
5. **Decisions never block other work.** Anything that needs the owner is written as one yes or no question, put on the board as Needs decision, and the work moves to the next Ready task. When the answer comes, record it as a `Decision (date):` line on the issue and move the issue on.
6. **Nothing goes live without a check.** Every change goes through QA with 390px screenshots, the unit tests and a load check on throttled 4G and 4x CPU before it is Done.

## Daily loop
1. Read the board. Count Ready tasks and Defined epics.
2. Finish or move on anything in Dev and QA. Move checked items to Done and close them.
3. Apply rules 1 to 4 above.
4. List open Needs decision items for the owner. Do not wait on them.
5. Write a short status: what moved, what is next, what needs a decision.

## Standing limits
- Site changes go live only through the deploy workflow. Contributors use fork and PR, and the owner merges after the PR check passes.
- Existing hypothesis cards are never changed by a rebuild. New cards get new IDs.
- Sourced claims only. Estimates are labelled as estimates.
