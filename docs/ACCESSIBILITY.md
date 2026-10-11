# Accessibility check: the three This week screens

Checked 2026-10-10 on a local copy of the site, with `node scripts/a11y_week.mjs --site <url>`. It opens each screen (Engineers, Deep-tech VCs, Curious geeks) at 320, 390 and 430px and reports contrast, tap targets, names, overflow and focus order. Raw results after the fixes: [docs/a11y/week-audit-2026-10-10.json](a11y/week-audit-2026-10-10.json). Standard used: WCAG 2.2 level AA.

| Check | 320 | 390 | 430 | Result |
|---|---|---|---|---|
| Text contrast (4.5:1, large text 3:1) | pass | pass | pass | One failure found and fixed: white text on the orange active pill was 2.94:1. It now uses the darker orange (5.4:1). |
| Tap targets (at least 24px, pills and arrows 44px and 48px) | pass | pass | pass | The "How it is computed" link is 15px tall but sits inside a sentence, which WCAG 2.2 exempts. |
| Labels (every link and button has a name) | pass | pass | pass | Previous and Next week have aria-labels. |
| Focus order | pass | pass | pass | Tab order follows the page: audience pills, week arrows, findings, story links. |
| Reduced motion | pass | pass | pass | The only motion on these screens is the loading skeleton, and `prefers-reduced-motion` turns it off. |
| Sideways overflow | pass | pass | pass | None at any width. |
| Headings | pass | pass | pass | Week title was an h2 with no h1 on the screen. It is now an h1, with h2 and h3 below. |

## Found and fixed in this pass

1. Active pill contrast, fixed in `style.css`. Before and after look the same apart from the darker orange.
2. Week screen had no h1, fixed in `weekly.js`.

## Found, outside these screens (new tasks)

- The home arrow animation (`.arrow`) had no reduced-motion rule. Task #151, fixed in the same deploy.

## Not checked

- Screen reader speech (VoiceOver, TalkBack). The names and order were checked in code only.
- Colour-only meaning: the verdict words are always written out on cards. Not re-checked on week screens beyond the "Rose" and "New" labels, which have text.

Screenshot after the fix at 390px: [docs/a11y/pill-after-390.png](a11y/pill-after-390.png).

---

# Accessibility check: Compare home, topic page, card, Tests, Method, story page (#180)

Checked 2026-10-11 on a local copy with `node scripts/a11y_pages.mjs` (Chrome, headless). It opens `#/`, `#/a/geeks`, `#/t/llm`, `#/c/h369/all`, `#/hypotheses`, `#/how` and `#/s/2026-10-11` at 320, 390 and 430px. Raw results after the fixes: [docs/a11y/pages-audit-2026-10-11.json](a11y/pages-audit-2026-10-11.json). Standard: WCAG 2.2 level AA.

| Check | 320 | 390 | 430 | Result |
|---|---|---|---|---|
| Text contrast (4.5:1, large text 3:1) | pass | pass | pass | Failed before: orange text on white was 2.73:1 (links, small headings, badges on the home, topic and story screens), white text on the orange verdict bar and badge was 2.94:1, grey notes 4.05:1. Text now uses the darker orange (5.4:1) and the grey is darker. Lines and fills keep the bright orange. |
| Sideways overflow | pass | pass | pass | Failed before at 320 and 390 on the home and topic screens: the row under the chart (Details, Share) was 37px too wide. It now wraps. The topic chips scroll inside their own row on purpose. |
| Names (every link, button, select, chart) | pass | pass | pass | Every chart has an aria-label and every control has text. |
| Headings | pass | pass | pass | One h1 on every screen. |
| Tap targets (24px or more) | pass | pass | pass | None smaller. |
| Image alt text | pass | pass | pass | No images without alt. |
| Landmarks | pass | pass | pass | Failed before: no main landmark. Each screen now has role="main". |

## Not checked
- Screen reader speech (VoiceOver, TalkBack). Names and order were checked in code only.
- Focus order by keyboard on the topic chips and the add-topic menu.
- Colour contrast of text inside chart images other than the axis labels.
