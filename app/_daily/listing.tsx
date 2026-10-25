'use client';

import { useState } from 'react';
import type { Listing } from './data';

// `sections` renders each group as a large heading; `filters` toggles the category pills and item tags
export default function ListingView({
  listing,
  sections = false,
  filters = true,
}: {
  listing: Listing;
  sections?: boolean;
  filters?: boolean;
}) {
  const [filter, setFilter] = useState<string | null>(null);
  const toggle = (category: string) => setFilter(filter === category ? null : category);

  const groups = listing.groups
    .map((day) => ({ ...day, items: day.items.filter((item) => !filter || item.category === filter) }))
    .filter((day) => day.items.length > 0);

  const counts = new Map<string, number>();
  for (const item of listing.groups.flatMap((day) => day.items)) {
    if (item.category) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  const total = listing.groups.reduce((n, day) => n + day.items.length, 0);

  if (listing.groups.length === 0) return <p className="muted">{listing.note || 'Nothing notable.'}</p>;

  return (
    <>
      {filters && (
        <div className="filter-bar" role="group" aria-label="Filter by category">
          <button type="button" className="tag" aria-pressed={filter === null} onClick={() => setFilter(null)}>
            All <span className="tag-count">{total}</span>
          </button>
          {[...counts].map(([category, count]) => (
            <button
              key={category}
              type="button"
              className="tag"
              aria-pressed={filter === category}
              onClick={() => toggle(category)}
            >
              {category} <span className="tag-count">{count}</span>
            </button>
          ))}
        </div>
      )}
      {groups.map((day) => (
        <div
          key={day.heading}
          className={sections ? 'type-section' : 'day'}
          data-type={day.heading.toLowerCase().split(' ')[0]}
        >
          {sections ? (
            <h2 className="type-heading">
              {day.heading} <span className="type-count">{day.items.length}</span>
            </h2>
          ) : (
            <h3>{day.heading}</h3>
          )}
          <ul className="event-list">
            {day.items.map((item, i) => (
              <li key={i}>
                <span>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="event-name">
                      {item.name}
                    </a>
                  ) : (
                    <span className="event-name">{item.name}</span>
                  )}
                  {item.category && filters && (
                    <button
                      type="button"
                      className="tag"
                      aria-pressed={filter === item.category}
                      title={filter === item.category ? 'Show all' : `Show only ${item.category}`}
                      onClick={() => toggle(item.category)}
                    >
                      {item.category}
                    </button>
                  )}
                </span>
                <span className="event-when">{item.where}</span>
                {item.description && <span>{item.description}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
