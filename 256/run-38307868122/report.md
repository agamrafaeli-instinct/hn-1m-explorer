## QA walk for #256 (390 px, report only)

Site: https://agamrafaeli-instinct.github.io/hn-1m-explorer/. 2 route(s). This walk lists what a script can see. Whether the copy reads well and a chart is clear is for the person reading the screenshots below.

**Ticket and its done-when list**

> Prune: remove the three audience pages
- [ ] As a visitor, opening #/a/engineers, #/a/vcs or #/a/geeks lands on the card list.
- [ ] As a visitor, I see no reader-type choice on the home page or Method page.
- [ ] As a reader of the card list, I still see the caveats that the audience notes carried.
- [ ] No link in pages or scripts points to #/a/.
- [ ] Audience share pages, checks and budgets are gone and the full test run reads OK.
- [ ] Checked on the live site at 390 px.

**Findings: 4**

### `#/hypotheses` 
- 2 control(s) with no name
- text under 12px: 11px: h300 · for engineers; 11px: Why care; 11px: What we saw

![#/hypotheses](https://raw.githubusercontent.com/agamrafaeli-instinct/hn-1m-explorer/qa-reports/256/run-38307868122/01.jpg)

<details><summary>Text a visitor reads</summary>

← Back EVERY CARD Hypotheses, tested Each card states a guess, what the data should show if it is true, and the check. Wrong guesses stay on the page. 113 CARDS H300 · FOR ENGINEERS Share Does the data back this claim: "TypeScript is replacing JavaScript in the conversation"? WHY CARE It checks whether this topic takes a different share of all HN stories now than it did across the earlier years. WHAT WE SAW In Latest 12 months (2025-08 to 2026-07), the share was 0.35. In All earlier stories (2006-10 to 2025-07), it was 0.08. 0.08 All earlier stories 0.35 Latest 12 months ratio 4.32x TAKEAWAY Yes. The ratio is 4.32x. It refutes the claim at 0.9x or less. CONTEXT Show the monthly line, 2006 to now KEEP IN MIND The thresholds were copied from earlier cards, so this test is exploratory. Caveats, the rules we set, source H301 · FOR ENGINEERS Share Did HN stories shift from chatbots to agents? WHY CARE It shows when AI talk on HN moved from one product name to a way of building. WHAT WE SAW From Oct 2006 to Jul 2025, 7,538 stories matched "agent" or "agents" and 17,154 matched "ChatGPT" or "GPT". From Aug 2025 to Jul 2026, it was 15,498 and 3,285. 0.44 All earlier stories 4.72 Latest 12  ...

</details>

### `#/a/engineers` 
- 2 control(s) with no name
- text under 12px: 11px: h300 · for engineers; 11px: Why care; 11px: What we saw

![#/a/engineers](https://raw.githubusercontent.com/agamrafaeli-instinct/hn-1m-explorer/qa-reports/256/run-38307868122/02.jpg)

<details><summary>Text a visitor reads</summary>

← Back EVERY CARD Hypotheses, tested Each card states a guess, what the data should show if it is true, and the check. Wrong guesses stay on the page. 113 CARDS H300 · FOR ENGINEERS Share Does the data back this claim: "TypeScript is replacing JavaScript in the conversation"? WHY CARE It checks whether this topic takes a different share of all HN stories now than it did across the earlier years. WHAT WE SAW In Latest 12 months (2025-08 to 2026-07), the share was 0.35. In All earlier stories (2006-10 to 2025-07), it was 0.08. 0.08 All earlier stories 0.35 Latest 12 months ratio 4.32x TAKEAWAY Yes. The ratio is 4.32x. It refutes the claim at 0.9x or less. CONTEXT Show the monthly line, 2006 to now KEEP IN MIND The thresholds were copied from earlier cards, so this test is exploratory. Caveats, the rules we set, source H301 · FOR ENGINEERS Share Did HN stories shift from chatbots to agents? WHY CARE It shows when AI talk on HN moved from one product name to a way of building. WHAT WE SAW From Oct 2006 to Jul 2025, 7,538 stories matched "agent" or "agents" and 17,154 matched "ChatGPT" or "GPT". From Aug 2025 to Jul 2026, it was 15,498 and 3,285. 0.44 All earlier stories 4.72 Latest 12  ...

</details>
