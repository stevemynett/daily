'use client';

import { useEffect, useState } from 'react';
import { formatDay, vancouverDay, type FrankiesShow } from '../_daily/frankies';

// Picks today's show in the browser, so it's right even if the last build was yesterday
export default function Tonight({ shows }: { shows: FrankiesShow[] | null }) {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(vancouverDay(new Date())), []);

  if (shows === null) return <p className="muted">Couldn't reach Frankie's calendar at the last build.</p>;
  if (!today) return null;

  const tonight = shows.filter((s) => s.day === today);
  const next = shows.find((s) => s.day > today);

  if (tonight.length === 0) {
    return (
      <p className="muted">
        No show tonight.
        {next && (
          <>
            {' '}
            Next is{' '}
            <a href={next.url} target="_blank" rel="noopener noreferrer">
              {next.name}
            </a>{' '}
            on {formatDay(next)}.
          </>
        )}
      </p>
    );
  }

  return (
    <ul className="event-list">
      {tonight.map((show) => (
        <li key={show.start}>
          <span>
            <a href={show.url} target="_blank" rel="noopener noreferrer" className="event-name">
              {show.name}
            </a>
            {show.availability && <span className="tag">{show.availability}</span>}
          </span>
          <span className="event-when">
            {show.time}
            {show.price && `, ${show.price}`}
          </span>
        </li>
      ))}
    </ul>
  );
}
