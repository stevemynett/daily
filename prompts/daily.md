Produce the daily listing for someone living in Vancouver, BC. It has four parts, each published as its own web page or panel: what's on in Metro Vancouver (games, concerts, comedy, live shows, festivals and fun things to do, and big public conventions), jazz shows, food events in Vancouver, and one photography pick for today. News is handled separately by the briefing command, and album releases by the records command, so leave both out.

## Window

Events: from today through $ARGUMENTS days from now (if that's blank, use 30 days), in the America/Vancouver timezone. List events by event date, not by when they were announced. Drop anything that has already happened.

Jazz: same window as events.

Food events: same window as events.

Photo pick: today only.

## Before you start

Read `~/briefings/context.md` if it exists. Only the reader feedback part applies here: thumbs up and down on whole categories and single items, plus free-text notes. A thumbs-down on a category means raise the bar and include fewer items. A thumbs-down on an item means skip that kind of item, or that venue or source if the pattern repeats. A thumbs-up means more like it. Notes are direct instructions from the reader and win over this prompt where they conflict. Ignore feedback on news sections and ignore the Already covered list, since an item can show up in more than one listing.

## How to gather

Fan out with the Task tool to keep this fast. Launch all 9 subagents in a single message so they run in parallel, and use the sonnet model for each:

- Sports
- Concerts
- Comedy
- Theatre and shows
- Festivals and fun, plus conventions and expos
- Exhibitions, film and talks (filed under Festivals and fun)
- Jazz
- Food dinners, pop-ups and supper clubs
- Food festivals, markets, classes and tastings

Give each subagent its window, its category descriptions and sources, and the feedback that applies to it. Ask it to return about twice as many candidates as its section needs, so you have room to choose. Events and jazz shows need: event name, category, venue, event date and time, direct URL, and a one-sentence description. Food events need the same fields as events.

Do the photo pick yourself once the subagents are back, since it draws on their events results.

Speed matters: the whole run should take about 10 minutes. Give each subagent a budget of 12 tool calls, counting searches and page reads together; the comedy subagent gets 15. When the budget is spent, return what you have. Tell each subagent to start with the listing pages named for its category below, since one page that gathers many items beats ten searches, then use WebSearch to fill gaps. Search results often carry enough (name, date, venue or label) to use an item without opening its page, so only open a page when a detail is missing. If a page blocks, errors or comes back empty, move on and don't retry it. Never look up a list of labels, artists or venues one by one; those lists describe the reader's taste. Search by topic, for example "Vancouver concerts this week", "Vancouver stand-up comedy November", "things to do in Vancouver this weekend", "Vancouver Convention Centre events November", "Vancouver restaurant opening September", "Vancouver restaurant closing", "Vancouver supper club", "Vancouver wine dinner November", "Vancouver restaurant review".

## Rules

- Events should feel like a local's pick, not a press release. Favour independent, quirky and community events over corporate ones. Skip brand activations, sponsored pop-ups that are really ads, product launches, networking nights, galas, business and trade conferences, and anything you'd need a company badge to attend. Large public conventions and expos are the exception, see Conventions and expos below.
- Every item needs a direct link to the event, ticket, restaurant or article page. Don't link to search pages or aggregators when the original is reachable.
- Item counts below are ceilings, not targets. Don't pad with minor items. If a category has nothing notable, leave it out. If a whole page has nothing, keep its `#` heading and write one line: `Nothing notable this time.`
- Each item appears once per page. A multi-day event or residency is one item, listed under its first date in the window, with the date range in the details.
- The description adds something the name doesn't: who's playing, the opponent, the chef, the price, the happy hour times. Don't restate the name.
- Output markdown only. Don't write status updates while the subagents run. No preamble before the first heading, no notes, and no closing summary. If a time can't be confirmed, write "time TBA" in the item.

## Format

The output is split into four files and pulled into another website, so keep it to plain markdown: headings, list items, bold and links. No tables, HTML, emoji or italics. Use the four `#` headings below exactly as written, in this order, and nothing else at the `#` level. Each page ends with its own generated line, since each one is read on its own.

### Events page

Start with `# Events in Vancouver`. Then one `##` heading per date that has events, in date order, written like `## Sat Oct 24`. Under each date, list that day's events sorted by start time, one line each:

`- **Event** [Category] Venue, 7:30pm. One-sentence description. [Tickets](URL)`

Category is exactly one of Sports, Concert, Comedy, Theatre and shows, Festivals and fun, or Conventions and expos. Use "Info" in place of "Tickets" when the link isn't a ticket page.

For events in the next 7 days with a ticket link, check whether they're sold out, using the listing page already open when it shows the status and opening the ticket page only when it doesn't. Skip the status for events further out. Put the status at the end of the line, just before the link: `(Sold out)` or `(Tickets available)`, for example `- **Josh Johnson** [Comedy] Vogue Theatre, 5pm. The Daily Show writer does a one-night stand-up set. (Sold out) [Tickets](URL)`. Leave it off for free events and when the page doesn't make the status clear. For events in the next 7 days, a news post or announcement isn't enough: find the official ticket page (the team or venue's box office, Ticketmaster or the promoter), check it, and link to it instead.

Last-minute changes go at the start of the description: `Cancelled.`, `Postponed to Nov 12.`, `New show added.` or `New tickets released.` Look for these for events in the next 7 days, including returned or newly released tickets for shows that had sold out.

When an event is free to attend, start its description with `Free.` and nothing else marks it, for example `- **Fall Open Studios** [Festivals and fun] Strathcona, 11am. Free. Forty artists open their studios for the weekend. [Info](URL)`. Only use it when entry is actually free, not for free events that need a paid ticket to something else.

End with one line: `Generated <Mon D, YYYY>, covering <Mon D> to <Mon D>.`

### Jazz page

Start with `# Jazz in Vancouver`. Then one `##` heading per date that has shows, in date order, written like `## Sat Oct 24`. Under each date, list that day's shows sorted by start time, one line each:

`- **Act** [Style] Venue, 8pm. One-sentence description. [Tickets](URL)`

Style is a short label for the music, one of Straight-ahead, Vocal, Big band, Latin jazz, Trad and swing, Fusion, Avant-garde, or Other. Use "Info" in place of "Tickets" when the link isn't a ticket page. A weekly residency or jam is one item under its first date, with the days in the description.

Mark ticket status the same way as on the events page: `(Sold out)` or `(Tickets available)` just before the link, checked on the ticket page. Frankie's sells through Turntable; its API at `https://frankiesjazzclub.turntabletickets.com/api/performance/?booking=true&pagination=false&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` gives each show's `sold` flag.

End with one line: `Generated <Mon D, YYYY>, covering <Mon D> to <Mon D>.`

### Food events page

Start with `# Food events in Vancouver`. Then one `##` heading per date that has events, in date order, written like `## Sat Oct 24`. Under each date, list that day's events sorted by start time, one line each:

`- **Event** [Category] Venue, Neighbourhood, 7pm. One-sentence description with the price. [Tickets](URL)`

Category is exactly one of Dinners and pop-ups, Festivals and markets, or Classes and tastings. Use "Info" in place of "Tickets" when the link isn't a ticket page. Mark free events and ticket status the same way as on the events page.

What goes in each category:

- Dinners and pop-ups: chef collaborations and guest-chef dinners, one-night pop-ups, supper clubs, wine, beer and sake dinners, and special set menus tied to a date or holiday.
- Festivals and markets: food and drink festivals, night and holiday food markets, neighbourhood food crawls, and food events at farmers markets.
- Classes and tastings: cooking classes, butchery and pasta workshops, wine, whisky and cheese tastings, and chef talks.

Events only. No restaurant openings, closings, reviews, new menus or happy hours, and no ongoing deals without a date.

The food page covers the City of Vancouver only. Leave out Richmond, Burnaby, Coquitlam, Surrey, New Westminster, Langley, the North Shore and every other suburb.

End with one line: `Generated <Mon D, YYYY>, covering <Mon D> to <Mon D>.`

### Photo pick

Start with `# Photo pick`. Then one `##` heading for today, written like `## Sun Oct 25`. Under it, exactly one line:

`- **Place or event** [Kind] Location, 4:30pm to sunset. Two or three sentences on why today. [Info](URL)`

Kind is exactly one of Street, Landscape, Night, or Event. Leave out the generated line on this page.

## Photo pick

Pick one place to go take photos today. Check today's hourly forecast for Vancouver first: WebFetch `https://api.open-meteo.com/v1/forecast?latitude=49.2827&longitude=-123.1207&hourly=weather_code,precipitation_probability,cloud_cover,visibility&daily=sunrise,sunset&timezone=America%2FVancouver&forecast_days=1`, and also check for an active Environment Canada warning.

- This pick is about the city and being out and about. Never pick a concert, jazz show, comedy set, theatre show or anything else inside a venue; the reader already has Frankie's and the jazz page for that.
- Good picks: golden hour or sunset at a specific viewpoint, fog on the water, fall colour, a clear night for city lights, street life in a specific block at a specific time, a market, parade, festival or other public outdoor event from the events page, seasonal things like cherry blossoms, king tides, snow on the North Shore or the first lights of a holiday display.
- Bad weather still gets an outdoor pick: reflections in Gastown or Chinatown at blue hour, umbrellas on Granville Street, the Granville Island market and its covered walkways, the seawall in storm surf. Keep the reader under cover or close to it when the rain is heavy.
- Name a specific spot and time window, not a whole neighbourhood or "anytime". Mention the sunset or golden-hour time when light matters, and the forecast in a few words.
- The link goes to the event page, or to the park or viewpoint's official page for a place.

## Categories

- Sports: professional teams and leagues in Metro Vancouver only, such as the Vancouver Whitecaps (MLS), PWHL Vancouver, Vancouver Rise FC (Northern Super League), the Vancouver Warriors (NLL) and the Vancouver Canadians in season, plus other professional women's leagues and national team games or tournaments held locally. No university or college teams (nothing from UBC, SFU or Trinity Western), and no junior or amateur sports. No NHL, no Canucks, no CFL, no BC Lions. Upcoming games only, no results or recaps. Give the opponent.
- Concert: notable shows, up to 8. Commodore Ballroom, Orpheum, Vogue Theatre, Queen Elizabeth Theatre, Rogers Arena, PNE Forum, Rickshaw Theatre, Fox Cabaret, Biltmore Cabaret, Chan Centre. Georgia Straight, Vancouver Is Awesome, Daily Hive, venue calendars. Jazz shows go on the jazz page, not here.
- Comedy: stand-up, improv, sketch and comedy festivals. Aim for 20 to 30, the reader wants a full comedy listing, so this category is a target rather than a ceiling. Include both touring headliners and the local scene: showcases, indie rooms and recurring nights, listing a weekly night once under its first date with the days in the description. Start with these listing pages, one read each: Eventbrite's Vancouver comedy listings (https://www.eventbrite.ca/d/canada--vancouver/comedy--events/, which gathers most indie shows), Showpass comedy for Vancouver (https://www.showpass.com/s/events/vancouver/?categories=comedy), Yuk Yuk's Vancouver, the Comedy Department's Vancouver shows, the Improv Centre (Vancouver TheatreSports), the Rio Theatre and the Fox Cabaret. Then a few topic searches such as "Vancouver stand-up comedy November 2026" for touring comics at the Vogue, Orpheum and Queen Elizabeth Theatre. The rooms the reader likes include Little Mountain Gallery, the Biltmore Cabaret and Comedy After Dark.
- Theatre and shows: plays, musicals, drag, burlesque, cabaret, magic and other notable live shows, up to 6. The Cultch, the Arts Club, the Rio Theatre, the Fox Cabaret, Georgia Straight.
- Festivals and fun: free events count for a lot here; aim for at least one free thing on most days in the first week, such as free festivals, markets, gallery openings, outdoor screenings, park and library events. Festivals, night and holiday markets, art walks and open studios, film screenings and series, outdoor events, odd one-offs, workshops, trivia and other things a curious local would want to do, up to 20, including what the exhibitions, film and talks subagent finds. Cover upcoming festivals across the whole window, listing a multi-day festival under its first date with the end date in the description. Scout Magazine (its weekly events and "things to do" posts), Daily Hive (its weekend and things-to-do roundups), Vancouver Is Awesome things to do, Georgia Straight, Miss604, Inside Vancouver, Destination Vancouver events, the Rio Theatre, VIFF Centre, and the City of Vancouver events calendar.
- Exhibitions, film and talks, filed under Festivals and fun:
  - Photography exhibitions and gallery openings and receptions: Polygon Gallery, Capture Photography Festival, the Vancouver Art Gallery, Contemporary Art Gallery, Belkin Art Gallery, Griffin Art Projects, Equinox Gallery, Catriona Jeffries, Unit 17, and Galleries West listings. Opening receptions are the event; list them on that date.
  - Museum exhibitions opening or closing soon: Museum of Vancouver, Museum of Anthropology at UBC, the Vancouver Maritime Museum, Science World, the Bill Reid Gallery, the Beaty Biodiversity Museum and the Vancouver Art Gallery. List an exhibition on its opening date, or on its last date with `Last chance.` at the start of the description when it closes within the window.
  - Film screenings and repertory cinema: special screenings, series, retrospectives and one-night events at The Cinematheque, VIFF Centre, the Rio Theatre and the Vancity Theatre. Not regular first-run releases.
  - Talks, lectures and author events: Vancouver Public Library, Vancouver Writers Fest, UBC and SFU public lectures, the Vancouver Institute, Massy Books, Iron Dog Books and other bookstores.
  - Cultural events at community centres and neighbourhood houses: City of Vancouver community centres, the Roundhouse, the Italian Cultural Centre, the Chinese Cultural Centre, the Japanese Hall and neighbourhood houses. Concerts, dance, cultural festivals and celebrations open to the public.
- Conventions and expos: large public conventions, consumer shows and fairs that anyone can buy a ticket to, at the Vancouver Convention Centre, BC Place, the PNE and Hastings Park, Rogers Arena, the Tradex in Abbotsford and the River Rock in Richmond. Fan and comic conventions, gaming and anime cons, home and garden shows, auto and boat shows, craft and holiday fairs. Food and wine festivals go on the food page. Up to 6. No industry-only trade shows or business conferences. Check each venue's own events calendar.
- Jazz: every jazz show in Metro Vancouver in the window, up to 30, including touring acts at major venues. Check these calendars first: Frankie's Jazz Club (frankiesjazzclub.ca), Coastal Jazz (coastaljazz.ca), the Hot Jazz Club, Pat's Pub at the Patricia Hotel, Blue Frog Studios in White Rock, Pyatt Hall, the Chan Centre, the Orpheum, the Vogue Theatre, Massey Theatre, Kay Meek Arts Centre, and the Commodore Ballroom. Then Georgia Straight and Vancouver Is Awesome listings. Skip background dinner music unless the act is notable.
- Food events, City of Vancouver only (no Richmond, Burnaby, Coquitlam, the North Shore or other suburbs): chef collaborations, pop-ups and supper clubs, wine and beer dinners, food festivals, night and holiday markets, food crawls, cooking classes, workshops and tastings. Up to 25. Real restaurants, chefs and producers, no chain promotions or brand activations. Scout Magazine (its Intel and events posts), Daily Hive Dished, Vancouver Magazine, Eater Vancouver, Vancouver Is Awesome, Georgia Straight food, Stir, Foodgressing, Inside Vancouver, Eventbrite, Tock, Resy events, Dished events listings, restaurant newsletters and Instagram when an article links them, and the cooking schools (Dirty Apron, Hawksworth's classes, Well Seasoned, The Pasta Workshop and the like). Food and drink festivals go here, not under Festivals and fun.
