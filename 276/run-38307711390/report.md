## QA walk for #276 (390 px, report only)

Site: https://agamrafaeli-instinct.github.io/hn-1m-explorer/. 3 route(s). This walk lists what a script can see. Whether the copy reads well and a chart is clear is for the person reading the screenshots below.

**Ticket and its done-when list**

> Rings: embed as beat 3 of the home essay
- [ ] Embed renders in the essay at 390 px
- [ ] Beat text approved by owner
- [ ] Same numbers as the standalone page

**Findings: 4**

### `#/` - HN swears it's about everything. We counted.
- text under 12px: 11px: Home; 11px: Explorer; 11px: Submit

![#/](https://raw.githubusercontent.com/agamrafaeli-instinct/hn-1m-explorer/qa-reports/276/run-38307711390/01.jpg)

<details><summary>Text a visitor reads</summary>

Hacker News, every story since 2006 HN swears it's about everything. We counted. Every story and the points it earned, asked one question at a time. Scroll Every story, counted Stories each year Points per story 2006 2026 Source: daily counts of every story in the archive, 2006-10 to 2026-07. 2006 and 2026 are partial years. Hollow bars: the archive holds low points for 2023 and 2026, so they are not compared. Year by year Tap or hover on anything for the number. Themes What came out of nowhere? What rises and falls, and what stays? 2006 2007 2008 2009 2010 2011 2012 2013 2014 2015 2016 2017 2018 2019 2020 2021 2022 2023 2024 2025 2026 Top domains, and their share of all stories 2006 T N A P 3 B B C 46% 2007 T N V N M R C S 12% 2008 T N R A A N V B 10% 2009 T N W N Y O A N 8% 2010 T N Y A W O R B 7% 2011 T Y N G A R W B 6% 2012 T G Y A N W F T 7% 2013 G Y T M N B A W 9% 2014 G M Y T N E T W 10% 2015 G M Y N T T E A 12% 2016 M G N Y T T B A 14% 2017 M G N Y T B A T 14% 2018 M G Y N T A B T 14% 2019 M G Y N E B T T 15% 2020 G M Y N E T T B 14% 2021 G Y E T N T A M 13% 2022 G Y T E N T B A 14% 2023 G Y E T N T W A 14% 2024 G Y E T T N A A 13% 2025 G Y N T E A T T 13% 2026 G Y T N E A  ...

</details>

### `#/rings` 
- text under 12px: 11px: Home; 11px: Explorer; 11px: Submit

![#/rings](https://raw.githubusercontent.com/agamrafaeli-instinct/hn-1m-explorer/qa-reports/276/run-38307711390/02.jpg)

<details><summary>Text a visitor reads</summary>

← Home What HN rewarded, year by year Tap or hover on anything for the number. Themes What came out of nowhere? What rises and falls, and what stays? 2006 2007 2008 2009 2010 2011 2012 2013 2014 2015 2016 2017 2018 2019 2020 2021 2022 2023 2024 2025 2026 Top domains, and their share of all stories 2006 T N A P 3 B B C 46% 2007 T N V N M R C S 12% 2008 T N R A A N V B 10% 2009 T N W N Y O A N 8% 2010 T N Y A W O R B 7% 2011 T Y N G A R W B 6% 2012 T G Y A N W F T 7% 2013 G Y T M N B A W 9% 2014 G M Y T N E T W 10% 2015 G M Y N T T E A 12% 2016 M G N Y T T B A 14% 2017 M G N Y T B A T 14% 2018 M G Y N T A B T 14% 2019 M G Y N E B T T 15% 2020 G M Y N E T T B 14% 2021 G Y E T N T A M 13% 2022 G Y T E N T B A 14% 2023 G Y E T N T W A 14% 2024 G Y E T T N A A 13% 2025 G Y N T E A T T 13% 2026 G Y T N E A T R 16% Story types 2006 2026 Source: titles and domains of every story since 2006. Darker is a bigger share than that theme's own average year. Domain counts use each month's top 20 sites, and the bar and percent on the right are those sites' share of all stories that year (orange) against all other stories (grey). Points are not used here, because the archive holds low points for 2023 ...

</details>

### `#/hypotheses` 
- 2 control(s) with no name
- text under 12px: 11px: h300 · for engineers; 11px: Why care; 11px: What we saw

![#/hypotheses](https://raw.githubusercontent.com/agamrafaeli-instinct/hn-1m-explorer/qa-reports/276/run-38307711390/03.jpg)

<details><summary>Text a visitor reads</summary>

← Back EVERY CARD Hypotheses, tested Each card states a guess, what the data should show if it is true, and the check. Wrong guesses stay on the page. 113 CARDS H300 · FOR ENGINEERS Share Does the data back this claim: "TypeScript is replacing JavaScript in the conversation"? WHY CARE It checks whether this topic takes a different share of all HN stories now than it did across the earlier years. WHAT WE SAW In Latest 12 months (2025-08 to 2026-07), the share was 0.35. In All earlier stories (2006-10 to 2025-07), it was 0.08. 0.08 All earlier stories 0.35 Latest 12 months ratio 4.32x TAKEAWAY Yes. The ratio is 4.32x. It refutes the claim at 0.9x or less. CONTEXT Show the monthly line, 2006 to now KEEP IN MIND The thresholds were copied from earlier cards, so this test is exploratory. Caveats, the rules we set, source H301 · FOR ENGINEERS Share Did HN stories shift from chatbots to agents? WHY CARE It shows when AI talk on HN moved from one product name to a way of building. WHAT WE SAW From Oct 2006 to Jul 2025, 7,538 stories matched "agent" or "agents" and 17,154 matched "ChatGPT" or "GPT". From Aug 2025 to Jul 2026, it was 15,498 and 3,285. 0.44 All earlier stories 4.72 Latest 12  ...

</details>
