'use client';

import { useState } from 'react';

type Hour = { time: string; chance: number; mm: number };

const hourOf = (time: string) => Number(time.slice(11, 13));
const label = (time: string) => {
  const h = hourOf(time);
  return `${h % 12 || 12} ${h < 12 ? 'a.m.' : 'p.m.'}`;
};
const amount = (mm: number) => (mm > 0 ? `, ${mm.toFixed(1)} mm` : '');

function summary(hours: Hour[], now: number) {
  const ahead = hours.slice(now);
  const likely = ahead.filter((h) => h.chance >= 50);
  if (likely.length > 0) {
    const first = likely[0];
    const last = likely.at(-1)!;
    return first === last
      ? `Rain likely around ${label(first.time)}.`
      : `Rain likely from ${label(first.time)} to ${label(last.time)}.`;
  }
  const peak = Math.max(0, ...ahead.map((h) => h.chance));
  return peak < 20 ? 'Little chance of rain for the rest of the day.' : `Up to ${peak}% chance of rain later today.`;
}

// Hourly chance of precipitation for today; `now` is the index of the current hour
export default function RainChart({ hours, now }: { hours: Hour[]; now: number }) {
  const [active, setActive] = useState<number | null>(null);
  const hovered = active === null ? null : hours[active];

  return (
    <figure className="rain-chart">
      <figcaption className="rain-readout">
        {hovered ? (
          <>
            <strong>{label(hovered.time)}</strong> {hovered.chance}% chance{amount(hovered.mm)}
          </>
        ) : (
          summary(hours, now)
        )}
      </figcaption>
      <div className="rain-plot" onMouseLeave={() => setActive(null)} aria-hidden="true">
        <span className="rain-grid" style={{ bottom: '50%' }} data-label="50%" />
        <span className="rain-grid" style={{ bottom: '100%' }} data-label="100%" />
        {hours.map((h, i) => (
          <span
            key={h.time}
            className="rain-hour"
            data-past={i < now}
            data-now={i === now}
            data-active={i === active}
            onMouseEnter={() => setActive(i)}
            onClick={() => setActive(i === active ? null : i)}
          >
            <span className="rain-bar" style={{ height: `${h.chance}%` }} />
          </span>
        ))}
      </div>
      <div className="rain-axis" aria-hidden="true">
        {hours.map((h) => (
          <span key={h.time}>{hourOf(h.time) % 6 === 0 ? label(h.time) : ''}</span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Hourly chance of precipitation today</caption>
        <thead>
          <tr>
            <th>Hour</th>
            <th>Chance</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {hours.map((h) => (
            <tr key={h.time}>
              <td>{label(h.time)}</td>
              <td>{h.chance}%</td>
              <td>{h.mm.toFixed(1)} mm</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
