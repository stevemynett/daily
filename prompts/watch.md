Recommend something to watch tonight for a household in Vancouver, BC. They have Netflix, Crave (which carries HBO and Max shows in Canada), Prime Video, Apple TV+ and Disney+ (which carries Hulu and FX shows in Canada), all on Canadian accounts. They find it hard to pick something, so the goal is a short list of good picks they'd actually enjoy.

## What they asked for

Request: $QUERY

Type: $TYPE (Any means movies or series are both fine)

## Their tastes

$PROFILE

## What they've marked before

$MARKS

They give each pick a thumbs up or down to tune what you suggest. Thumbs up means more like this. Thumbs down means less like this: work out what the down-voted titles share (genre, tone, pacing, creator) and steer away from it. "Want to watch" titles are also taste signals.

Never suggest a title with a thumbs down, or one marked "Want to watch" or "Watched", since they already have it on their list.

## Their Netflix history

Every show and movie they've played on Netflix, with the number of plays (episodes for a series). A high count is a strong signal that they loved it. One or two plays of a series usually means they tried it and gave up. Don't suggest anything on this list, unless a new season has come out since and they watched most of the earlier ones.

$NETFLIX

## Picked in recent searches

$RECENT

Don't repeat these unless one fits this request much better than anything new.

## How to pick

- They mostly watch recent releases, so lean towards movies, series and new seasons from the last year or so. Quality comes first, though. A great older title beats a weak new one, and a new season of a show that's still good counts as recent.
- Only pick titles that are streaming in Canada on Netflix, Crave, Prime Video, Apple TV+ or Disney+ as part of the subscription. Rentals, purchases, and add-on channels like Starz or Paramount+ through Prime don't count. Check each one on JustWatch Canada (justwatch.com/ca) or the service's own Canadian page before including it.
- Judge quality from critics and audiences: Rotten Tomatoes, Metacritic, IMDb, and reviews from places like the Guardian, Vulture or the AV Club. Skip anything that critics and audiences both disliked.
- Read the request literally. "Something like X" means similar tone and feel, not only the same genre. A mood ("light", "can't look away", "something we can half-watch") matters as much as the genre.
- Use WebSearch and WebFetch, up to 20 searches. Look at "best new on Netflix Canada", "new on Crave this month", "best shows on Disney+ Canada", "Prime Video Canada new releases", "best Apple TV+ shows" and recent best-of lists, then check availability.
- Give 6 to 10 picks, best fit first. Mix the services when the fit is equal, but don't force it.

## Output

Output one fenced json block and nothing else, with no text before or after it. It's an array of objects with these fields:

```json
[
  {
    "title": "Title as listed on the service",
    "kind": "Series",
    "year": 2024,
    "service": "Crave",
    "released": "Season 2 out Oct 3, 2026",
    "genres": ["Crime drama", "Dark comedy"],
    "length": "2 seasons, 8 episodes each",
    "rating": "RT 94%, IMDb 8.0",
    "why": "Two to four sentences on why it fits this request and their tastes, naming who's in it or who made it and what it feels like to watch.",
    "url": "https://www.justwatch.com/ca/tv-show/..."
  }
]
```

- `kind` is exactly "Movie" or "Series".
- `service` is exactly one of "Netflix", "Crave", "Prime Video", "Apple TV+" or "Disney+". Hulu and FX titles are "Disney+", and HBO and Max titles are "Crave". If it's on more than one, pick one.
- `year` is the first release year as a number.
- `released` says when it came out, or when the newest season did.
- `length` is the runtime for a movie ("1h 52m"), or the seasons and episodes for a series.
- `rating` has one or two scores you found. Use an empty string if you didn't find any.
- `url` is the JustWatch Canada page, or else the service's page for the title.
