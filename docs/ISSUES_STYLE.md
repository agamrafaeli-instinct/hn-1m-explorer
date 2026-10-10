# Issues style guide

How to write issues and board text in this repo. Issues and the board are public.

## Voice
- Neutral and factual. Simple words, short sentences, no filler, no em dashes.
- No personal names, handles of private people, or private context (chats, accounts, plans, tokens). Refer to roles: "the owner", "a contributor", "the data agent".
- Say what is true and sourced. Do not write who "wanted" or "was happy with" something.

## Decisions
- Record a decision as a decision, in one line, with the date: `Decision (2026-10-09): scope B for all three audiences.`
- Approvals: `Approved: rebuild the 24 older cards as new cards.` Rejections: `Declined: show full-history strips on the 56 cards.`
- Say what the decision changes and what it leaves alone. Do not quote a person.
- A changed decision gets a new line that names the earlier one. Do not edit the old line.

## Status and ownership live in board fields
- **Status**: Grooming, Dev, QA, Done. **Horizon**: Now, Next, Later. Start and Target dates feed the Roadmap view.
- Do not write status in the title or body ("WIP", "blocked", "in review"). Move the card on the board.
- Owner is the assignee. Do not write names in the body.
- Close a finished issue with the commit or PR that did the work. Close a dropped issue as "not planned" with a `Declined:` line.

## Title
- Start with a verb or a clear noun phrase, under 80 characters, no trailing period.
- Epics: `[Epic] - <Snazzy Code Name> - What the epic is in up to seven words`. The code name is one or two words and is unique among epics. Example: `[Epic] - Pulse - Weekly state of HN per audience`. Do not number or letter epics. Tasks: the step itself, for example `Compare week to previous week: rose, fell, new`.
- QA tasks start with `QA:`. A walkthrough for a batch of new abilities starts with `QA walkthrough:` and follows the format in FLYWHEEL.md (numbered steps, one link, one "You should see" line and a yes / no per step). Specs start with `Spec:`.

## Body
Use these sections, in this order, and leave out any that do not apply:
1. **Why**: one or two sentences.
2. **What**: the change, as a user would see it or as data fields.
3. **Acceptance criteria**: a checklist. Each item can be checked by someone else. Include the numbers (for example "390px, no horizontal scroll", "loads in under 2 s on throttled 4G").
4. **Sources**: links to the spec, data file or commit.
5. **Decisions**: the decision lines above.

Link the parent epic as a sub-issue, not in text.

## Labels
- `epic`: a large piece of work with sub-issues. `task`: one step of an epic.
- `hypothesis`: a card or card idea. `data`: data, series or archive work. `feature`: site feature or explorer change. `bug`, `documentation`, `accessibility`: as GitHub describes them.
- `needs-agam` marks an item waiting for an owner decision. The name is historical. Use it only for that, and clear it when the decision is recorded.
- Do not use labels for status. The board does that. `ready`, `in-progress`, `review` and `done` are not used for new work.
- One type label per issue (`epic`, `task`, `hypothesis`, `data`, `feature` or `bug`) plus optional `accessibility` or `documentation`.

## Do not put in an issue
Tokens, passwords, private links, personal contact details, or text copied from a private chat.
