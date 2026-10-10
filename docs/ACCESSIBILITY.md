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
