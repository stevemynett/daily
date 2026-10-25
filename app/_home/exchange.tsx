'use client';

import { useEffect, useState } from 'react';

// Bank of Canada's daily average rate, published each business day around 4:30pm Eastern
const URL = 'https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json?recent=30';

type Valet = { observations: { d: string; FXUSDCAD: { v: string } }[] };

const day = (iso: string) =>
  new Date(`${iso}T12:00`).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });

export default function Exchange() {
  const [rates, setRates] = useState<{ date: string; rate: number }[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(URL)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: Valet) =>
        setRates(
          data.observations
            .map((o) => ({ date: o.d, rate: Number(o.FXUSDCAD.v) }))
            .sort((a, b) => a.date.localeCompare(b.date)),
        ),
      )
      .catch(() => setFailed(true));
  }, []);

  if (failed) return <p className="muted">The exchange rate isn't available right now.</p>;
  if (!rates) return <p className="muted">Loading exchange rate…</p>;
  if (rates.length < 2) return <p className="muted">No recent rate published.</p>;

  const latest = rates.at(-1)!;
  const previous = rates.at(-2)!;
  const change = latest.rate - previous.rate;
  const values = rates.map((r) => r.rate);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = rates
    .map((r, i) => `${((i / (rates.length - 1)) * 120).toFixed(1)},${(28 - ((r.rate - min) / (max - min || 1)) * 24).toFixed(1)}`)
    .join(' ');

  return (
    <div className="exchange">
      <div className="stat">
        <span className="stat-label">1 USD in CAD</span>
        <span className="stat-value">${latest.rate.toFixed(4)}</span>
        <span className="stat-note" data-trend={change > 0 ? 'up' : change < 0 ? 'down' : 'flat'}>
          {change >= 0 ? '+' : ''}
          {change.toFixed(4)} since {day(previous.date)} · 1 CAD = {(1 / latest.rate).toFixed(4)} USD
        </span>
      </div>
      <svg viewBox="0 0 120 30" className="exchange-chart" aria-label={`Range over the last ${rates.length} business days`}>
        <polyline points={points} />
      </svg>
    </div>
  );
}
