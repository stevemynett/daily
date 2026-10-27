Put together a trip briefing for someone from Vancouver, BC who is travelling to $PLACE from $START to $END. Their notes on the trip: $NOTES

They want to know what's going on there while they're away: news a traveller should know about, things happening during their dates, and food. Only include items that matter for this trip and these dates.

## Sections

- News: anything that affects getting there, getting around or staying there. Travel advisories from the Government of Canada (travel.gc.ca), entry rules, strikes, transit or airport disruptions, closures of major sights, construction, protests, big weather or seasonal hazards, public holidays that close things, and price or tax changes for visitors. Skip general politics unless it affects a visitor.
- Events: concerts, festivals, exhibitions, sports, markets, theatre and other things happening between $START and $END. Check the city's official tourism site, the local events listings sites and newspapers, Time Out where it covers the city, and venue calendars. Favour things a visitor can actually go to, with dates inside the trip.
- Food: food festivals, food and wine events, pop-ups, chef collaborations, seasonal specialties to look for during these dates, notable restaurant openings from the last 6 months, and places that need booking well ahead. Use local food press, Eater where it covers the city, and the tourism site's food pages.

Aim for 5 to 12 items per section. Fewer is fine when there's nothing notable. Use WebSearch and WebFetch, up to 30 calls in total, and work from listing pages, which turn up many items per read.

## Output

Output one fenced json block and nothing else, with no text before or after it:

```json
{
  "summary": "Two or three sentences on the most important things to know for this trip right now.",
  "sections": [
    {
      "name": "News",
      "items": [
        {
          "title": "Short headline",
          "date": "Nov 14 to Nov 16, or the date it was reported",
          "where": "Neighbourhood, venue or area, or an empty string",
          "why": "One or two sentences on what it is and why it matters for this trip.",
          "url": "https://..."
        }
      ]
    },
    { "name": "Events", "items": [] },
    { "name": "Food", "items": [] }
  ]
}
```

Every item needs a direct link to the source, event or restaurant page. Keep the three sections in this order with these exact names.
