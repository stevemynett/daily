Produce a news briefing for someone living in Vancouver, BC, covering the last few days. Events, jazz, food and drink (including restaurant, bar and cafe openings and closings) and album releases are handled separately by the daily command, so leave them out.

The reader already follows the feeds listed below, so a briefing built only from those feeds tells them nothing new. Use the feeds to check dates quickly, then go wider. The goal is to surface things the reader wouldn't have seen: stories from outlets outside the feed list, smaller items that matter, and news from adjacent fields. Aim for at least half the items in each section to come from outlets that aren't in the feed list.

## Window

- News: articles published in the last $ARGUMENTS days (if that's blank, use 2 days), counting back from today in the America/Vancouver timezone. Check each article's publish date and drop anything older.
- Slower sections (In your field, Arts and culture, History, Podcasts and Worth reading): the last 7 days, since good pieces there are less frequent. The already-covered list still applies.

## Before you start

Read `~/briefings/context.md` if it exists. It has two parts.

Reader feedback lists thumbs up and down from past briefings, on whole sections and on single items, plus free-text notes. A thumbs-down on a section means raise the bar and include fewer items. A thumbs-down on an item means skip that kind of story, or that source if the pattern repeats. A thumbs-up means more like it. Notes are direct instructions from the reader and win over this prompt where they conflict. Feedback on event, jazz, food scene and album sections (Sports, Concerts, Comedy and shows, Jazz, Food scene, Food and drink, Albums) belongs to the daily command, so ignore it here.

Already covered lists headlines and URLs from the last two briefings. Don't repeat any of them unless there's a real new development, and then say what changed.

## How to gather

Fan out with the Task tool to keep this fast. Launch all 7 subagents in a single message so they run in parallel, and use the sonnet model for each:

- Vancouver and BC, weather and hazards
- Canada, world, money
- Tech and AI, update now
- Dev tools and open source, new apps
- Science and space, history, Mac and Apple, photography
- In your field, worth reading, podcasts
- Arts and culture

Give each subagent the window, its section descriptions and sources, the feeds for its sections, the already-covered list, and the feedback that applies to its sections. Ask it to return about twice as many candidates as its sections need, so you have room to choose, with these fields for each: headline, source, publish date, direct URL, and a one-sentence summary.

Tell each subagent to work this way:

1. WebFetch the feeds listed for its sections first. Feeds include publish dates, so use those to filter the window instead of opening each article.
2. Then use WebSearch to look beyond the feed list, up to 10 searches. Search by topic rather than by outlet, for example "Vancouver council vote", "BC Supreme Court ruling", "new Mac app". Good places to find what the feeds miss: Reuters, AP, the Guardian, BBC, the Globe and Mail, the Canadian Press, Bloomberg, the Financial Times, Rest of World, and trade or specialist outlets.
3. Don't fetch an article page unless the date or URL is missing from the feed or search result.

## Feeds

- CBC British Columbia: https://www.cbc.ca/webfeed/rss/rss-canada-britishcolumbia
- Vancouver Is Awesome: https://www.vancouverisawesome.com/rss
- The Logic: https://thelogic.co/feed/
- Canadaland: https://www.canadaland.com/feed/
- Policy Options: https://policyoptions.irpp.org/feed/
- TechCrunch: https://techcrunch.com/feed/
- The Verge: https://www.theverge.com/rss/index.xml
- Lobsters: https://lobste.rs/rss
- GitHub Trending: https://github.com/trending
- Product Hunt: https://www.producthunt.com/feed
- MacStories: https://www.macstories.net/feed/
- Apple security releases: https://support.apple.com/en-us/100100
- Ars Technica science: https://feeds.arstechnica.com/arstechnica/science
- Quanta Magazine: https://www.quantamagazine.org/feed/
- NASA: https://www.nasa.gov/feed/
- Ars Technica: https://feeds.arstechnica.com/arstechnica/index
- The Atlantic: https://www.theatlantic.com/feed/all/
- MacRumors: https://www.macrumors.com/macrumors.xml
- 9to5Mac: https://9to5mac.com/feed/
- Nikon Rumors: https://nikonrumors.com/feed/
- PetaPixel: https://petapixel.com/feed/

## Rules

- Every item needs a direct link to the original article. Don't link to search pages or aggregators when the original is reachable. If the same story is covered by a paywalled and a free source, link the free one.
- Item counts below are ceilings, not targets. If a section has nothing notable, write "Nothing notable." Don't pad with minor stories.
- Dedupe everything. Each story appears exactly once in the whole briefing. An item in Top stories is not repeated in its normal section. When several outlets cover the same event, or a follow-up adds little to an earlier report, keep the single best article.
- The summary adds something the headline doesn't: the number, the consequence, the date it takes effect. Don't restate the headline.
- Output markdown only. Don't write status updates while the subagents run. No preamble before the first heading and no closing summary.

## Format

Start with `# Briefing for <weekday, Month D, YYYY>`. Each section is a `##` heading. Each item is one line:

`- **Headline** (Source, Mon D): one-sentence summary. <URL>`

End with one line: `_Generated <date>, covering the last N days._`

## Sections, in this order

1. Top stories: the 3 to 5 most important news items from everything below. Leave these out of their normal sections.
2. Vancouver and BC: city news, council and Park Board decisions, major development approvals, provincial politics and BC-wide stories. Up to 7 items. CBC British Columbia, Vancouver Sun, CTV Vancouver, Global BC, Vancouver Is Awesome, Daily Hive, The Tyee, Business in Vancouver, City of Vancouver and BC government news releases.
3. Weather and hazards: active Environment Canada warnings for Metro Vancouver, atmospheric rivers, wildfires and air quality, notable earthquakes (Earthquakes Canada). If nothing is active, write "Nothing notable."
4. Canada: national news, including US and foreign decisions with a direct impact on Canada, such as tariffs, the border and trade. Up to 6. CBC, Globe and Mail, CTV, Canadian Press, The Logic, Canadaland, Policy Options.
5. World: major global stories with real consequences: wars and ceasefires, elections that change governments, economic shocks, disasters, major court rulings and treaties. Up to 6. Rank by how much the story changes things for many people, not by how much it's being covered, and say in the summary what the consequence is. Don't let US politics fill the whole section. Reuters, AP, BBC, the Guardian, the Financial Times, the Economist, Al Jazeera, Rest of World.
6. Money: Bank of Canada, CAD/USD, markets, housing, inflation. Up to 4, and only moves that matter.
7. Update now: emergency updates a person should install on their own devices, such as Apple OS releases, Chrome, Firefox, Windows, widely used apps and home routers, plus breaches where an individual needs to act, like resetting a password. Name the version to update to. Up to 3, and "Nothing notable." is the usual answer. No enterprise security, threat-actor news, ransomware stories or vulnerability research.
8. Tech and AI: notable company news, funding rounds, acquisitions, layoffs, AI model releases and regulation. Up to 6. TechCrunch, The Verge, The Logic, Bloomberg.
9. Dev tools and open source: major language and framework releases, notable new projects on GitHub Trending. Check for new releases of Python, Node.js, Homebrew and Claude Code. Up to 5. Lobsters, The Verge.
10. New apps: new apps, or major updates to existing ones, that are worth trying. Mac, iOS, web and command line, with indie apps welcome. Say the platform and the price model. Up to 6. Product Hunt, MacStories, 9to5Mac, The Verge, Lobsters, GitHub Trending.
11. Science and space: significant discoveries and results first (new findings published in journals, with the journal named in the summary), then launches and missions. Up to 6. Skip incremental studies and press-release hype. Nature news, Science news, Quanta Magazine, New Scientist, Ars Technica science, Scientific American, NASA, SpaceX.
12. History: new historical research and discoveries, such as archaeological finds, newly read documents, DNA studies of ancient people, and notable new history books or archives. Up to 4. Smithsonian Magazine, Ars Technica archaeology, Live Science, the Guardian archaeology and history, Science and Nature news, Archaeology Magazine, History Today.
13. Mac and Apple: news and rumours. App releases go in New apps instead. Up to 5. MacRumors, 9to5Mac, AppleInsider, The Verge.
14. Photography: Nikon first (Nikon Rumors, Nikon press releases), then major camera, lens and industry news (PetaPixel, DPReview). Up to 5.
15. Arts and culture: art, books, film, TV, music and theatre news and criticism, such as major prizes, notable openings and reviews, deaths of significant artists, and arts funding and institution news, including Vancouver's (the Vancouver Art Gallery, the Arts Club, the Cultch, VIFF). Up to 5. Event listings belong to the daily command, so no "what's on" items. The Guardian culture, the New York Times arts, the New Yorker culture, Hyperallergic, ARTnews, Literary Hub, CBC Arts, Stir, Georgia Straight arts.
16. In your field: articles widely discussed among people in engineering leadership, incident management and SRE, security, and fintech. Up to 6, spread across the four. Pick pieces that people in those fields are sharing and arguing about, such as essays, notable public postmortems, breach write-ups with lessons, and industry analysis, not product announcements. Say in the summary why it's getting attention. Engineering leadership: The Pragmatic Engineer, LeadDev, Will Larson (lethain.com), Charity Majors, Lobsters discussions. Incident management and SRE: SRE Weekly, public postmortems from cloud and SaaS providers, the VOID. Security: tl;dr sec, Risky Business, Krebs on Security, The Record. Fintech: Fintech Business Weekly, Net Interest, This Week in Fintech, Finextra, American Banker. Enterprise security stories belong here, not in Update now.
17. Podcasts: 2 to 4 recent episodes worth a listen, with the show name, episode title, length and why it's worth the time. Favour interviews and reporting over chat shows, and episodes that fit the reader's interests (tech, engineering leadership, jazz and music, photography, science, Vancouver and Canada). Link the episode page, not the show page. Podnews, the Guardian and the Atlantic podcast picks, Apple Podcasts editorial, and the shows' own sites.
18. Worth reading: 3 to 5 long-form essays, features or investigations that are worth the time, not news. Say roughly how long each one is. The New Yorker, the Atlantic, The Walrus, ProPublica, the Guardian Long Read, Wired, Aeon, Quanta Magazine, Stratechery, Longreads, Lobsters.
