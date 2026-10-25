'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Listing, ListingItem } from '../_daily/data';

const SHOWN = 5;

// events.md groups by day under headings like `Sun Oct 25`
const heading = (date: Date) => {
  const part = (options: Intl.DateTimeFormatOptions) =>
    date.toLocaleDateString('en-US', { timeZone: 'America/Vancouver', ...options });
  return `${part({ weekday: 'short' })} ${part({ month: 'short' })} ${part({ day: 'numeric' })}`;
};

// What the reader cares about most, highest first. Jazz items carry a style
// (Straight-ahead, Vocal...) as their category, so they're scored as `jazz`.
const INTEREST: Record<string, number> = {
  jazz: 100,
  Comedy: 80,
  Sports: 70,
  Concert: 60,
  'Theatre and shows': 40,
  'Conventions and expos': 25,
  'Festivals and fun': 20,
};

const RECURRING = /\b(weekly|every (mon|tues|wednes|thurs|fri|satur|sun)day|nightly|wednesday to sunday|runs .* through)\b/i;

function score(item: ListingItem & { jazz?: boolean }) {
  let points = item.jazz ? INTEREST.jazz : (INTEREST[item.category ?? ''] ?? 10);
  // One-off and touring shows beat the standing weekly nights
  if (RECURRING.test(item.description)) points -= 30;
  if (item.tickets === 'Sold out') points -= 40;
  if (/time TBA/i.test(item.where)) points -= 5;
  return points;
}

// Picks today's group in the browser, so it's right even if the last build was
// yesterday, then shows the few most interesting; the Events page has the rest
export default function TodayEvents({ listing, jazz }: { listing: Listing | null; jazz: Listing | null }) {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(heading(new Date())), []);

  if (listing === null) return <p className="muted">No listing yet. Run `make daily`.</p>;
  if (!today) return null;

  const todays = (l: Listing | null) => l?.groups.find((group) => group.heading === today)?.items ?? [];
  // Frankie's has its own section above
  const jazzToday = todays(jazz)
    .filter((item) => !/Frankie's/i.test(item.where))
    .map((item) => ({ ...item, jazz: true }));
  const items = [...jazzToday, ...todays(listing)]
    .map((item, order) => ({ item, order, points: score(item) }))
    .sort((a, b) => b.points - a.points || a.order - b.order)
    .map(({ item }) => item);

  if (items.length === 0) return <p className="muted">Nothing listed for today.</p>;
  // The Events page has the full day, but not the jazz listing
  const onEvents = todays(listing).length;

  return (
    <>
      <ul className="event-list">
        {items.slice(0, SHOWN).map((item, i) => (
          <li key={i}>
            <span>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="event-name">
                  {item.name}
                </a>
              ) : (
                <span className="event-name">{item.name}</span>
              )}
              {item.category && <span className="tag">{'jazz' in item ? 'Jazz' : item.category}</span>}
              {item.tickets && (
                <span className="badge" data-tickets={item.tickets === 'Sold out' ? 'sold-out' : 'available'}>
                  {item.tickets}
                </span>
              )}
            </span>
            <span className="event-when">{item.where}</span>
            {item.description && <span>{item.description}</span>}
          </li>
        ))}
      </ul>
      {items.length > SHOWN && (
        <p className="market-meta">
          <Link href="/events">See all {onEvents} events today</Link>
        </p>
      )}
    </>
  );
}
