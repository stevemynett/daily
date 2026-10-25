import type { Listing } from '../_daily/data';

// The single pick the daily run writes to photo.md, under a heading for the day it was made
export default function PhotoPick({ listing }: { listing: Listing | null }) {
  const day = listing?.groups[0];
  const pick = day?.items[0];
  if (!day || !pick) return <p className="muted">No pick yet. Run `make daily`.</p>;

  return (
    <ul className="event-list">
      <li>
        <span>
          {pick.url ? (
            <a href={pick.url} target="_blank" rel="noopener noreferrer" className="event-name">
              {pick.name}
            </a>
          ) : (
            <span className="event-name">{pick.name}</span>
          )}
          {pick.category && <span className="badge">{pick.category}</span>}
        </span>
        <span className="event-when">
          {pick.where} · {day.heading}
        </span>
        {pick.description && <span>{pick.description}</span>}
      </li>
    </ul>
  );
}
