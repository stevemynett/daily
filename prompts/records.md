Produce the Records page for someone living in Vancouver, BC: new and upcoming album releases in jazz, Latin, Cuban, salsa, Afro-Cuban and New Orleans music. The reader wants a long list to browse, 60 to 100 albums, so finding volume is the main job of this run.

## Window

Released: jazz from the last 2 months, and Latin, salsa, Cuban, Afro-Cuban and New Orleans from the last 3 months, since they come out less often.

Upcoming: albums with an announced release date between tomorrow and 3 months from now. Upcoming releases are a big part of the point: the reader wants to know what's coming. Skip albums with only a season or a year.

## Before you start

Read `~/briefings/context.md` if it exists. Only the reader feedback on albums applies here: thumbs up and down on single albums, plus free-text notes. A thumbs-down on an album means skip that kind of album, or that label if the pattern repeats. A thumbs-up means more like it. Notes are direct instructions from the reader and win over this prompt where they conflict. Ignore everything else in that file.

## What counts

New studio and live albums, EPs and notable reissues in jazz, Latin (including Latin jazz, son, bolero, cumbia, boogaloo, merengue, plena), Cuban, salsa, Afro-Cuban, and New Orleans music (jazz, brass band, funk, R&B, soul, zydeco, Cajun, bounce). Smaller-label and independent releases count, and so do reissues and archival releases. and archival releases count. No reggaeton or Latin pop, except new studio albums by the Latin urban artists named below. The artists and labels named for each genre show the reader's taste: use them to judge what fits and as search ideas. Work from listing pages and topic searches ("new salsa album October 2026", "nuevo disco de salsa 2026", "timba nuevo disco 2026", "new Latin jazz album 2026", "new brass band album 2026", "new New Orleans funk album"), which turn up many releases per search. AllMusic's new releases page (https://www.allmusic.com/newreleases) tags each week's albums by genre, including Jazz and Latin, and is worth a read for every album subagent.

## How to gather

Fan out with the Task tool. Launch all 6 subagents in a single message so they run in parallel, and use the sonnet model for each. Give each a budget of 30 tool calls, counting searches and page reads together, and ask it to return about one and a half times its target so you have room to drop weak or duplicate albums. Each album needs: artist, album title, genre, label, release date, direct URL, and a three-to-four-sentence description.

- Charts and new-release lists. Read each of these once and return every album on them that fits the genres and the window, with its label and release date: Billboard's Jazz Albums, Contemporary Jazz Albums and Traditional Jazz Albums charts (billboard.com/charts/jazz-albums/ and its sibling charts), Billboard's Tropical Albums and Latin Albums charts (billboard.com/charts/tropical-albums/, billboard.com/charts/latin-albums/), JazzWeek's weekly jazz radio chart, the Roots Music Report's jazz, Latin jazz and tropical charts, WTJU's weekly "new jazz releases" posts for the window, and AllMusic's new releases page (https://www.allmusic.com/newreleases) for each week in the window, Jazz and Latin tags. Radio charts are full of albums from small labels that never get reviewed, and those count. No target: return everything that fits.
- Jazz albums released (see below).
- Jazz albums upcoming, aim for 15 to 25. Read the "coming soon", "upcoming releases" or pre-order pages of Blue Note, ECM, Impulse!, Verve, Smoke Sessions, International Anthem, Pi Recordings, Criss Cross, Posi-Tone, Cellar Music, SmallsLIVE, Whirlwind, Sunnyside, Mack Avenue and Edition, plus Bandcamp pre-orders and searches like "new jazz album out December 2026" and "jazz album announced release date 2027".
- Salsa and Cuban albums (see below).
- Latin jazz, Afro-Cuban and other Latin albums (see below).
- New Orleans albums (see below).

Every genre subagent also gets the chart and new-release pages above as listing pages. The three Latin and New Orleans subagents look for upcoming albums too, with their own searches ("nuevo disco salsa diciembre 2026", "new Latin jazz album out January 2027", "new brass band album announced") and the labels' pre-order pages. On this page, reading the labels' release and pre-order pages one at a time is fine, since that's where most of the volume is.

When a page blocks, errors or comes back empty, move on and don't retry it. Search results often carry enough (artist, album, label, date) to use an album without opening its page.

When the subagents are back, merge their lists. Remove duplicates (same artist and album) and fill a missing label, date or link from another subagent's copy. Check the dates against the window. Then write the page.

## Genres and sources

- Jazz albums released, aim for 25 to 30. Listing pages: AllMusic new releases, Bandcamp Daily's monthly "The Best Jazz on Bandcamp" (https://daily.bandcamp.com/best-jazz), and search results for DownBeat, JazzTimes and All About Jazz reviews. Think Blue Note, ECM, Impulse!, Smoke Sessions, International Anthem, Pi, Criss Cross, Posi-Tone, Cellar Music and SmallsLIVE.
- Salsa and Cuban albums, released and upcoming, aim for 20 to 30. Listing pages: Latin Jazz Network's album reviews and Tropical Report (https://latinjazznet.com/category/reviews/albums/), NPR Alt.Latino, AllMusic's Latin tag, plus topic searches in English and Spanish. Salsa romántica, salsa dura and timba all count; file timba under Cuban. Think Spanish Harlem Orchestra, Tony Succar, Tromboranga, Havana D'Primera, Maykel Blanco y su Salsa Mayor, Daniela Darcourt, Luis Figueroa, Víctor Manuelle, Gilberto Santa Rosa and Marc Anthony, and Fania, Tico and Alegre reissues from Craft Latino.
- Latin jazz, Afro-Cuban and other Latin albums (son, bolero, cumbia, boogaloo, Latin soul, merengue, plena), released and upcoming, aim for 20 to 30. Listing pages: Latin Jazz Network's album reviews, NPR Alt.Latino, AllMusic's Latin and Jazz tags. Think Patois, Truth Revolution, ZOHO, Sunnyside and Motéma for Latin jazz, and Juan Luis Guerra, Elvis Crespo, Milly Quezada, Los Pleneros de la Cresta and Plena Libre for merengue and plena, filed under Latin.
  - Latin urban and crossover, filed under Latin, only for new studio albums by Bad Bunny, KAROL G, Rauw Alejandro, Daddy Yankee, J Balvin, Feid, Nathy Peluso, Romeo Santos, Prince Royce, Manuel Turizo, Carlos Vives or Ryan Castro. One search covers it ("new album 2026" with a few of the names); no singles or deluxe repackages.
- New Orleans albums, released and upcoming, aim for 20 to 30. Listing pages: AllMusic new releases, WWOZ's news and show host blog, and search results for OffBeat album reviews and Louisiana Music Factory. Albums by New Orleans artists go under New Orleans even when they're jazz records, so they don't count against the jazz cap. Think Rebirth, the Soul Rebels, Hot 8, Dirty Dozen and Preservation Hall for brass, Trombone Shorty, Kermit Ruffins, Leroy Jones, Nicholas Payton and Jon Batiste for jazz, Galactic, Dumpstaphunk, Jon Cleary and Irma Thomas for funk and soul, Big Freedia and Tank and the Bangas for bounce and R&B, and Basin Street, Louisiana Red Hot and Rounder for labels. For the Neville Brothers, the Meters and Dr. John, reissues and archival releases only.

## Rules

- 60 to 100 albums is a target, not a ceiling. Don't trim good albums to tidy the page. Go under 50 only if the subagents genuinely came back short, and if one did, send it back for one more pass with new searches before you write the page.
- Every album needs a direct link. Don't link to search pages.
- Each album appears once.
- The description adds something the name doesn't: who plays on it, what it sounds like, how it was made. Don't restate the name.
- Output markdown only. Don't write status updates while the subagents run. No preamble before the heading, no notes, and no closing summary.

## Format

Plain markdown only: headings, list items, bold and links. No tables, HTML, emoji or italics.

Start with `# Album releases`. Then one `##` heading per release date, newest first, upcoming dates included, written like `## Fri Oct 23`. Under each date, one line per album:

`- **Artist, Album** [Genre] Label. Description. (New) [Listen](URL)`

The description is a short paragraph of three or four sentences on the same line: who plays on it, what the music sounds like, how it was made or where it fits in the artist's work. The site shows it in a pop-up, so it can run longer than the other pages' one-liners.

Genre is exactly one of Jazz, Latin jazz, Latin, Cuban, Salsa, Afro-Cuban, or New Orleans.

End the description with `(New)` for a newly recorded album or `(Reissue)` for anything recorded before: reissues, remasters, anniversary editions, and archival releases of previously unreleased old recordings. For a reissue, give the original year in the description.

Jazz is capped at 60 albums; when the jazz subagents return more, keep the 60 most notable. There's no cap on jazz as a share of the page, since Latin and New Orleans releases are scarcer and a short page is worse than a jazz-heavy one. Never drop a Latin, salsa, Cuban, Afro-Cuban or New Orleans album to make room for jazz. A Latin jazz album by a Latin artist or on a Latin label is Latin jazz, not Jazz. Link each album to its Spotify album page (`https://open.spotify.com/album/...`) when a search result or a page already open shows it; the site opens these in the Spotify app. Don't spend a search per album hunting for Spotify links. Only when it isn't on Spotify, link the Bandcamp, label or review page instead, with "Info" in place of "Listen" when the link is a review. Use "Pre-order" in place of "Listen" for an album that isn't out yet.

End with one line: `Generated <Mon D, YYYY>, covering <Mon D> to <Mon D>.` Nothing comes after it: no notes, caveats or summary of the run.
