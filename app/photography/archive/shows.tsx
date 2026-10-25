'use client';

import { useState } from 'react';
import type { Show } from './data';

export default function Shows({ shows }: { shows: Show[] }) {
  const [venue, setVenue] = useState<string | null>(null);
  const [instrument, setInstrument] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const counts = new Map<string, number>();
  for (const show of shows) {
    for (const name of new Set(show.musicians.flatMap((m) => m.instruments))) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  const instruments = [...counts].sort((a, b) => b[1] - a[1]);

  const venues = new Map<string, number>();
  for (const show of shows) venues.set(show.venue, (venues.get(show.venue) ?? 0) + 1);

  const q = query.trim().toLowerCase();
  const plays = (show: Show) => !instrument || show.musicians.some((m) => m.instruments.includes(instrument));
  const matches = (show: Show) =>
    !q || show.band.toLowerCase().includes(q) || show.musicians.some((m) => m.name.toLowerCase().includes(q));
  const visible = shows.filter((show) => (!venue || show.venue === venue) && plays(show) && matches(show));

  const highlighted = (name: string, instruments: string[]) =>
    (instrument && instruments.includes(instrument)) || (q && name.toLowerCase().includes(q));

  return (
    <>
      <div className="archive-controls">
        <input
          type="search"
          className="search-input"
          placeholder="Search bands and musicians"
          aria-label="Search bands and musicians"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="muted result-count">
          {visible.length} of {shows.length} shows
        </span>
      </div>

      <div className="filter-bar" role="group" aria-label="Filter by venue">
        <button type="button" className="tag" aria-pressed={venue === null} onClick={() => setVenue(null)}>
          All venues
        </button>
        {[...venues].map(([name, count]) => (
          <button
            key={name}
            type="button"
            className="tag"
            aria-pressed={venue === name}
            onClick={() => setVenue(venue === name ? null : name)}
          >
            {name} <span className="tag-count">{count}</span>
          </button>
        ))}
      </div>

      <div className="filter-bar" role="group" aria-label="Filter by instrument">
        <button type="button" className="tag" aria-pressed={instrument === null} onClick={() => setInstrument(null)}>
          All instruments
        </button>
        {instruments.map(([name, count]) => (
          <button
            key={name}
            type="button"
            className="tag"
            aria-pressed={instrument === name}
            onClick={() => setInstrument(instrument === name ? null : name)}
          >
            {name} <span className="tag-count">{count}</span>
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Date</th>
              <th>Venue</th>
              <th>Band</th>
              <th>Musicians</th>
              <th style={{ textAlign: 'right' }}>Photos</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((show, r) => (
              <tr key={r}>
                <td>{show.year}</td>
                <td>{show.date}</td>
                <td>{show.venue}</td>
                <td className="col-band">{q && show.band.toLowerCase().includes(q) ? <mark>{show.band}</mark> : show.band}</td>
                <td className="col-musicians">
                  {show.musicians.map((m, i) => (
                    <span key={i}>
                      {i > 0 && ', '}
                      <span className={highlighted(m.name, m.instruments) ? 'musician-match' : undefined}>
                        {m.name}
                        {m.instruments.length > 0 && <span className="muted"> ({m.instruments.join(', ')})</span>}
                      </span>
                    </span>
                  ))}
                  {show.likely && (
                    <span className="muted" title="Likely lineup, not confirmed for this date">
                      {' '}
                      *
                    </span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>{show.photos}</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  No shows match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
