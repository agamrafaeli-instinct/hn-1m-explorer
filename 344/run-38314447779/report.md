## QA walk for #344 (390 px, report only)

Site: https://agamrafaeli-instinct.github.io/hn-1m-explorer/. 3 route(s). This walk lists what a script can see. Whether the copy reads well and a chart is clear is for the person reading the screenshots below.

**Ticket and its done-when list**

> Toolbox: QA walk taps the first link and button on each page
- [ ] Each route reports what its first tap did
- [ ] A tap that causes a console error or 404 is flagged
- [ ] Report only, still exits 0

**Findings: 0**

### `#/` - HN swears it's about everything. We counted.
- nothing flagged

_Taps:_ first link "Explore the data SEARCH STORIE": went to #/explore; first button "What came out of nowhere?": page text changed

![#/](https://raw.githubusercontent.com/agamrafaeli-instinct/hn-1m-explorer/qa-reports/344/run-38314447779/01.jpg)

<details><summary>Text a visitor reads</summary>

Hacker News, every story since 2006 HN swears it's about everything. We counted. Every story and the points it earned, asked one question at a time. Scroll Every story, counted Stories each year Points per story 2006 2026 Source: daily counts of every story in the archive, 2006-10 to 2026-07. 2006 and 2026 are partial years. Hollow bars: the archive holds low points for 2023 and 2026, so they are not compared. Year by year Tap or hover on anything for the number. Themes What came out of nowhere? What rises and falls, and what stays? 2006 2007 2008 2009 2010 2011 2012 2013 2014 2015 2016 2017 2018 2019 2020 2021 2022 2023 2024 2025 2026 Top domains, and their share of all stories 2006 T N A P 3 B B C 46% 2007 T N V N M R C S 12% 2008 T N R A A N V B 10% 2009 T N W N Y O A N 8% 2010 T N Y A W O R B 7% 2011 T Y N G A R W B 6% 2012 T G Y A N W F T 7% 2013 G Y T M N B A W 9% 2014 G M Y T N E T W 10% 2015 G M Y N T T E A 12% 2016 M G N Y T T B A 14% 2017 M G N Y T B A T 14% 2018 M G Y N T A B T 14% 2019 M G Y N E B T T 15% 2020 G M Y N E T T B 14% 2021 G Y E T N T A M 13% 2022 G Y T E N T B A 14% 2023 G Y E T N T W A 14% 2024 G Y E T T N A A 13% 2025 G Y N T E A T T 13% 2026 G Y T N E A  ...

</details>

### `#/how` 
- nothing flagged

_Taps:_ first link "How to read trends": went to #/lesson; no visible button to tap

![#/how](https://raw.githubusercontent.com/agamrafaeli-instinct/hn-1m-explorer/qa-reports/344/run-38314447779/02.jpg)

<details><summary>Text a visitor reads</summary>

Method Every number on this site is computed from public Hacker News data, in your browser. Data. Every Hacker News story since 2006, from a public archive: titles, links, points and comment counts, plus daily counts of stories, comments, jobs and polls. Comment text and author names are held only for the newest items, which a daily job pulls from the public HN API. Exact counts and dates are in data/archive/manifest.json and data/manifest.json. Centers of gravity. For each lens (author, domain, words, hour, weekday, month, points, comments, type) we measure how concentrated points are, for example what share the top 1% of stories hold. Year by year. Themes are the share of a year's story titles that name the theme. Top sites are counted from each month's top 20 domains. Both are built from the full archive. Questions. Each card asks one question, sets the number that would answer it before looking, and shows the result with its caveats. The answer is computed from the data, never typed. Wrong guesses stay on the page. Today's story. Each day a script reads the monthly title counts and looks for topics whose answer changes with the window you pick, or whose latest month jumps above ...

</details>

### `#/rings` 
- nothing flagged

_Taps:_ first link "← Home": went to #/; first button "What came out of nowhere?": page text changed

![#/rings](https://raw.githubusercontent.com/agamrafaeli-instinct/hn-1m-explorer/qa-reports/344/run-38314447779/03.jpg)

<details><summary>Text a visitor reads</summary>

← Home What HN rewarded, year by year Tap or hover on anything for the number. Themes What came out of nowhere? What rises and falls, and what stays? 2006 2007 2008 2009 2010 2011 2012 2013 2014 2015 2016 2017 2018 2019 2020 2021 2022 2023 2024 2025 2026 Top domains, and their share of all stories 2006 T N A P 3 B B C 46% 2007 T N V N M R C S 12% 2008 T N R A A N V B 10% 2009 T N W N Y O A N 8% 2010 T N Y A W O R B 7% 2011 T Y N G A R W B 6% 2012 T G Y A N W F T 7% 2013 G Y T M N B A W 9% 2014 G M Y T N E T W 10% 2015 G M Y N T T E A 12% 2016 M G N Y T T B A 14% 2017 M G N Y T B A T 14% 2018 M G Y N T A B T 14% 2019 M G Y N E B T T 15% 2020 G M Y N E T T B 14% 2021 G Y E T N T A M 13% 2022 G Y T E N T B A 14% 2023 G Y E T N T W A 14% 2024 G Y E T T N A A 13% 2025 G Y N T E A T T 13% 2026 G Y T N E A T R 16% Story types 2006 2026 Source: titles and domains of every story since 2006. Darker is a bigger share than that theme's own average year. Domain counts use each month's top 20 sites, and the bar and percent on the right are those sites' share of all stories that year (orange) against all other stories (grey). Points are not used here, because the archive holds low points for 2023 ...

</details>
