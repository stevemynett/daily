Produce the daily listing for someone living in Vancouver, BC. It has five parts, each published as its own web page or panel: what's on in Metro Vancouver (games, concerts, comedy, live shows, festivals and fun things to do, and big public conventions), jazz shows, Vancouver food scene news, new album releases in jazz, Latin, Cuban and New Orleans music, and one photography pick for today. News is handled separately by the briefing command, so leave it out.

## Window

Events: from today through $ARGUMENTS days from now (if that's blank, use 30 days), in the America/Vancouver timezone. List events by event date, not by when they were announced. Drop anything that has already happened.

Jazz: same window as events.

Food scene: openings and closings from the last 2 months, plus openings announced for the next month. Other food news (new menus, chef changes, deals) from the last 14 days. Anything dated (a special dinner, a limited menu, a sale, a festival) that runs between today and 1 month from now. Drop deals and dinners that have already ended.

Albums: releases from 1 month ago through 1 month from now.

Photo pick: today only.

## Before you start

Read `~/briefings/context.md` if it exists. Only the reader feedback part applies here: thumbs up and down on whole categories and single items, plus free-text notes. A thumbs-down on a category means raise the bar and include fewer items. A thumbs-down on an item means skip that kind of item, or that venue or source if the pattern repeats. A thumbs-up means more like it. Notes are direct instructions from the reader and win over this prompt where they conflict. Ignore feedback on news sections and ignore the Already covered list, since an item can show up in more than one listing.

## How to gather

Fan out with the Task tool to keep this fast. Launch all 10 subagents in a single message so they run in parallel, and use the sonnet model for each:

- Sports
- Concerts
- Comedy
- Theatre and shows
- Festivals and fun, plus conventions and expos
- Jazz
- Food openings and closings
- Food menus, deals and special dinners
- Jazz albums
- Latin, Cuban and New Orleans albums

Give each subagent its window, its category descriptions and sources, and the feedback that applies to it. Ask it to return about twice as many candidates as its section needs, so you have room to choose. Events and jazz shows need: event name, category, venue, event date and time, direct URL, and a one-sentence description. Food items need: restaurant or event name, type, neighbourhood, relevant dates, direct URL, and a one-sentence description. Albums need: artist, album title, genre, label, release date, direct URL, and a one-sentence description.

Do the photo pick yourself once the subagents are back, since it draws on their events and jazz results.

Tell each subagent to check the listed sources first, then use WebSearch to find what those miss, up to 10 searches. The four food and album subagents get up to 20 searches each and should read each source's recent archive pages, not only its front page, going back the full window. Search by topic, for example "Vancouver concerts this week", "Vancouver stand-up comedy November", "things to do in Vancouver this weekend", "Vancouver Convention Centre events November", "Vancouver restaurant opening September", "Vancouver restaurant closing", "new jazz album October 2026", "new salsa album 2026".

## Rules

- Events should feel like a local's pick, not a press release. Favour independent, quirky and community events over corporate ones. Skip brand activations, sponsored pop-ups that are really ads, product launches, networking nights, galas, business and trade conferences, and anything you'd need a company badge to attend. Large public conventions and expos are the exception, see Conventions and expos below.
- Every item needs a direct link to the event, ticket, restaurant, article or album page. Don't link to search pages or aggregators when the original is reachable.
- Item counts below are ceilings, not targets. Don't pad with minor items. If a category has nothing notable, leave it out. If a whole page has nothing, keep its `#` heading and write one line: `Nothing notable this time.`
- Each item appears once per page. A multi-day event or residency is one item, listed under its first date in the window, with the date range in the details.
- The description adds something the name doesn't: who's playing, the opponent, the chef, the price, the happy hour times, the personnel on the record. Don't restate the name.
- Output markdown only. Don't write status updates while the subagents run. No preamble before the first heading, no notes, and no closing summary. If a time can't be confirmed, write "time TBA" in the item.

## Format

The output is split into five files and pulled into another website, so keep it to plain markdown: headings, list items, bold and links. No tables, HTML, emoji or italics. Use the five `#` headings below exactly as written, in this order, and nothing else at the `#` level. Each page ends with its own generated line, since each one is read on its own.

### Events page

Start with `# Events in Vancouver`. Then one `##` heading per date that has events, in date order, written like `## Sat Oct 24`. Under each date, list that day's events sorted by start time, one line each:

`- **Event** [Category] Venue, 7:30pm. One-sentence description. [Tickets](URL)`

Category is exactly one of Sports, Concert, Comedy, Theatre and shows, Festivals and fun, or Conventions and expos. Use "Info" in place of "Tickets" when the link isn't a ticket page.

End with one line: `Generated <Mon D, YYYY>, covering <Mon D> to <Mon D>.`

### Jazz page

Start with `# Jazz in Vancouver`. Then one `##` heading per date that has shows, in date order, written like `## Sat Oct 24`. Under each date, list that day's shows sorted by start time, one line each:

`- **Act** [Style] Venue, 8pm. One-sentence description. [Tickets](URL)`

Style is a short label for the music, one of Straight-ahead, Vocal, Big band, Latin jazz, Trad and swing, Fusion, Avant-garde, or Other. Use "Info" in place of "Tickets" when the link isn't a ticket page. A weekly residency or jam is one item under its first date, with the days in the description.

End with one line: `Generated <Mon D, YYYY>, covering <Mon D> to <Mon D>.`

### Food scene page

Start with `# Vancouver food scene`. Then one `##` heading per type that has items, in this order: `## Openings`, `## Closings`, `## New menus`, `## Deals and happy hours`, `## Special dinners and events`. Under each, newest news first, or soonest date first for dated items, one line each:

`- **Restaurant or event** [Type] Neighbourhood, Oct 24. One-sentence description. [Info](URL)`

Type is exactly the `##` heading it sits under, without the `##`. The date is when it opened or closed, when the menu or deal starts, or the dinner date; write a range like `Oct 24 to Nov 2` when it has one, and "ongoing" for an open-ended happy hour. Neighbourhood is the area or city, like Gastown, Mount Pleasant, or Richmond.

End with one line: `Generated <Mon D, YYYY>, covering news since <Mon D>.`

### Albums page

Start with `# Album releases`. Then one `##` heading per release date, newest first, written like `## Fri Oct 23`. Under each date, one line per album:

`- **Artist, Album** [Genre] Label. One-sentence description. [Listen](URL)`

Genre is exactly one of Jazz, Latin jazz, Latin, Cuban, Salsa, Afro-Cuban, or New Orleans. Use "Pre-order" in place of "Listen" for albums not out yet, and "Info" when the link is a review or announcement.

End with one line: `Generated <Mon D, YYYY>, covering <Mon D> to <Mon D>.`

### Photo pick

Start with `# Photo pick`. Then one `##` heading for today, written like `## Sun Oct 25`. Under it, exactly one line:

`- **Place or event** [Kind] Location, 4:30pm to sunset. Two or three sentences on why today. [Info](URL)`

Kind is exactly one of Concert, Street, Landscape, Night, or Event. Leave out the generated line on this page.

## Photo pick

Pick one place to go take photos today. Check today's hourly forecast for Vancouver first: WebFetch `https://api.open-meteo.com/v1/forecast?latitude=49.2827&longitude=-123.1207&hourly=weather_code,precipitation_probability,cloud_cover,visibility&daily=sunrise,sunset&timezone=America%2FVancouver&forecast_days=1`, and also check for an active Environment Canada warning.

- The reader shoots with Nikon and mostly photographs live jazz. A jazz show tonight from the jazz page, especially at Frankie's Jazz Club, is a strong pick on any day, and the default when the weather is bad.
- When the weather is good, weigh an outdoor spot against the shows: golden hour or sunset at a specific viewpoint, fog on the water, fall colour, a clear night for city lights, or a street event or festival from the events page with good light.
- Rain can be a reason to go out too (reflections in Gastown or Chinatown at blue hour), but only if it's light and the reader would be under cover or close to it.
- Name a specific spot and time window, not a whole neighbourhood or "anytime". Mention the sunset or golden-hour time when light matters, and the forecast in a few words.
- The link goes to the show or event page, or to the park or viewpoint's official page for a place.

## Categories

- Sports: Vancouver Whitecaps, and women's sports in Metro Vancouver at every level, such as PWHL Vancouver, Vancouver Rise FC, UBC and SFU women's teams, and national team games or tournaments held locally. No NHL, no Canucks, no CFL, no BC Lions. Upcoming games only, no results or recaps. Give the opponent.
- Concert: notable shows, up to 8. Commodore Ballroom, Orpheum, Vogue Theatre, Queen Elizabeth Theatre, Rogers Arena, PNE Forum, Rickshaw Theatre, Fox Cabaret, Biltmore Cabaret, Chan Centre. Georgia Straight, Vancouver Is Awesome, Daily Hive, venue calendars. Jazz shows go on the jazz page, not here.
- Comedy: stand-up, improv, sketch and comedy festivals, up to 15. Include both touring headliners and the local scene: showcases, indie rooms and recurring nights, listing a weekly night once under its first date with the days in the description. Yuk Yuk's Vancouver, Little Mountain Gallery, the Improv Centre on Granville Island (Vancouver TheatreSports), the Rio Theatre, Fox Cabaret, Biltmore Cabaret, touring comics at the Vogue, Orpheum and Queen Elizabeth Theatre, Georgia Straight, Showpass and Eventbrite comedy listings for Vancouver, and comedians' and venues' Instagram when a listing links them.
- Theatre and shows: plays, musicals, drag, burlesque, cabaret, magic and other notable live shows, up to 6. The Cultch, the Arts Club, the Rio Theatre, the Fox Cabaret, Georgia Straight.
- Festivals and fun: festivals, night and holiday markets, art walks and open studios, film screenings and series, outdoor events, odd one-offs, workshops, trivia and other things a curious local would want to do, up to 12. Scout Magazine (its weekly events and "things to do" posts), Daily Hive (its weekend and things-to-do roundups), Vancouver Is Awesome things to do, Georgia Straight, Miss604, Inside Vancouver, Destination Vancouver events, the Rio Theatre, VIFF Centre, and the City of Vancouver events calendar.
- Conventions and expos: large public conventions, consumer shows and fairs that anyone can buy a ticket to, at the Vancouver Convention Centre, BC Place, the PNE and Hastings Park, Rogers Arena, the Tradex in Abbotsford and the River Rock in Richmond. Fan and comic conventions, gaming and anime cons, home and garden shows, auto and boat shows, craft and holiday fairs, wine and food festivals. Up to 6. No industry-only trade shows or business conferences. Check each venue's own events calendar.
- Jazz: every jazz show in Metro Vancouver in the window, up to 30, including touring acts at major venues. Check these calendars first: Frankie's Jazz Club (frankiesjazzclub.ca), Coastal Jazz (coastaljazz.ca), the Hot Jazz Club, Pat's Pub at the Patricia Hotel, Blue Frog Studios in White Rock, Pyatt Hall, the Chan Centre, the Orpheum, the Vogue Theatre, Massey Theatre, Kay Meek Arts Centre, and the Commodore Ballroom. Then Georgia Straight and Vancouver Is Awesome listings. Skip background dinner music unless the act is notable.
- Food scene: restaurant, bar and cafe openings and closings, new menus and chef changes, sales and limited-time deals, happy hours, collaboration and special dinners, pop-ups, tastings and food festivals. Aim for 20 to 25 items across the page, with openings and closings the largest sections. Real restaurants and bars only, no chain promotions or grocery deals. Daily Hive Dished (including its monthly openings and closings roundups), Scout Magazine (including its Intel and openings posts), Vancouver Magazine, Eater Vancouver, Vancouver Is Awesome, Georgia Straight food, Stir, Urban Diner, Inside Vancouver, Foodgressing, and restaurant Instagram or websites when an article links them.
- Albums: new studio and live albums, EPs and notable reissues in jazz, Latin (including Latin jazz, son, bolero, cumbia, boogaloo), Cuban, salsa, Afro-Cuban, and New Orleans music (jazz, brass band, funk, R&B, zydeco). Aim for 25 to 35 across the page. No reggaeton or Latin pop unless the reader asks for it.
  - Jazz albums: DownBeat (new releases and reviews), Cellar Music Group (Cellar Live), SmallsLIVE, Mack Avenue Records, Blue Note, Smoke Sessions, Posi-Tone, Criss Cross, HighNote and Savant, Origin Records, Impulse!, ECM, Whirlwind, JazzTimes, All About Jazz new releases, Bandcamp jazz.
  - Latin, Cuban and New Orleans albums: Bandcamp, Craft Latino, Fania, Patois, Ropeadope, Basin Street Records, Louisiana Red Hot, OffBeat Magazine, WWOZ, Latin Jazz Network, NPR Alt.Latino, Songlines, AllMusic new releases.
