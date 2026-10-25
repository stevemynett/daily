'use client';

import { useEffect, useState } from 'react';
import type { Listing, ListingItem } from '../_daily/data';

const TZ = 'America/Vancouver';
const HALF_YEAR = 182 * 86_400_000;

type Entry = ListingItem & { day: string; heading: string };

// YYYY-MM-DD for a date in Vancouver
const dayOf = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date);

// Listing headings are like "Sun Oct 25" with no year, so pick the year closest to now
function headingDay(heading: string, now: Date) {
  const parsed = new Date(`${heading.replace(/^\w+\s+/, '')} ${now.getFullYear()} 12:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.getTime() - now.getTime() > HALF_YEAR) parsed.setFullYear(parsed.getFullYear() - 1);
  else if (now.getTime() - parsed.getTime() > HALF_YEAR) parsed.setFullYear(parsed.getFullYear() + 1);
  return dayOf(parsed);
}

const entries = (listings: (Listing | null)[], now: Date): Entry[] =>
  listings.flatMap((listing) =>
    (listing?.groups ?? []).flatMap((group) => {
      const day = headingDay(group.heading, now);
      return day ? group.items.map((item) => ({ ...item, day, heading: group.heading })) : [];
    }),
  );

// Start time from "Venue, 7:30pm" in minutes, for sorting; untimed items sort last
function minutes(where: string) {
  const m = where.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!m) return 24 * 60;
  return ((Number(m[1]) % 12) + (m[3].toLowerCase() === 'pm' ? 12 : 0)) * 60 + Number(m[2] ?? 0);
}

const isFree = (item: ListingItem) => /^free\b/i.test(item.description);

// Friday to Sunday of this week, from tomorrow on if it's already the weekend; next weekend on Sundays
function weekendDays(now: Date) {
  const weekday = new Date(`${dayOf(now)}T12:00`).getDay();
  const start = weekday === 0 ? 5 : weekday >= 5 ? 1 : 5 - weekday;
  const end = weekday === 0 ? 7 : 7 - weekday;
  const days = [];
  for (let i = start; i <= end; i++) days.push(dayOf(new Date(now.getTime() + i * 86_400_000)));
  return days;
}

function Row({ item, showDay }: { item: Entry; showDay?: boolean }) {
  return (
    <li>
      <span>
        {item.url ? (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="event-name">
            {item.name}
          </a>
        ) : (
          <span className="event-name">{item.name}</span>
        )}
        {item.category && <span className="tag">{item.category}</span>}
        {item.tickets && (
          <span className="badge" data-tickets={item.tickets === 'Sold out' ? 'sold-out' : 'available'}>
            {item.tickets}
          </span>
        )}
      </span>
      <span className="event-when">{showDay ? `${item.heading} · ${item.where}` : item.where}</span>
    </li>
  );
}

// Filters the events and jazz listings in the browser, so "today" is right even when the build is old
export default function Agenda({ listings, pick }: { listings: (Listing | null)[]; pick: 'free' | 'weekend' }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  if (listings.every((l) => l === null)) return <p className="muted">No listing yet. Run `make daily`.</p>;
  if (!now) return null;

  const all = entries(listings, now);
  const today = dayOf(now);
  const byTime = (a: Entry, b: Entry) => a.day.localeCompare(b.day) || minutes(a.where) - minutes(b.where);

  let items: Entry[];
  let empty: string;
  if (pick === 'free') {
    items = all.filter((item) => item.day === today && isFree(item));
    empty = 'No free events listed for today.';
  } else {
    const days = weekendDays(now);
    items = all.filter((item) => days.includes(item.day) && item.tickets !== 'Sold out');
    empty = 'Nothing listed for the weekend yet.';
  }

  if (items.length === 0) return <p className="muted">{empty}</p>;
  return (
    <ul className="event-list">
      {items.sort(byTime).map((item, i) => (
        <Row key={i} item={item} showDay={pick === 'weekend'} />
      ))}
    </ul>
  );
}
