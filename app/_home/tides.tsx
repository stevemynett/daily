'use client';

import { useEffect, useState } from 'react';
import type { TideData } from './tide-data';

const TZ = 'America/Vancouver';
const W = 600;
const H = 150;
const TOP = 26;
const BOTTOM = 116;

const time = (date: Date) =>
  date.toLocaleTimeString('en-CA', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).replace(/\.$/, '');
const hour = (date: Date) => date.toLocaleTimeString('en-CA', { timeZone: TZ, hour: 'numeric' }).replace(/\.$/, '');

const arrow = (high: boolean) => (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <path d={high ? 'M6 2 11 9H1z' : 'M6 10 1 3h10z'} />
  </svg>
);

// Shows the build's predictions from 3 hours ago to 21 hours ahead, picked in the browser
export default function Tides({ data }: { data: TideData | null }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  if (data === null) return <p className="muted">Couldn't reach the tide predictions at the last build.</p>;
  if (!now) return null;

  const from = new Date(now.getTime() - 3 * 3_600_000);
  const to = new Date(now.getTime() + 21 * 3_600_000);
  const inWindow = (p: { at: string }) => new Date(p.at) >= from && new Date(p.at) <= to;
  const tides = data.hilo
    .map((p, i) => {
      const other = data.hilo[i + 1] ?? data.hilo[i - 1];
      return { at: new Date(p.at), metres: p.metres, high: !!other && p.metres > other.metres };
    })
    .filter((t) => t.at >= from && t.at <= to);
  const curve = data.curve.filter(inWindow).map((p) => ({ at: new Date(p.at), metres: p.metres }));
  if (curve.length < 2) return <p className="muted">The last build's tide predictions have run out.</p>;

  const values = curve.map((p) => p.metres);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (date: Date) => ((date.getTime() - from.getTime()) / (to.getTime() - from.getTime())) * W;
  const y = (metres: number) => BOTTOM - ((metres - min) / (max - min || 1)) * (BOTTOM - TOP);
  const path = curve.map((p, i) => `${i ? 'L' : 'M'} ${x(p.at).toFixed(1)} ${y(p.metres).toFixed(1)}`).join(' ');

  // Current level, interpolated between the 15-minute predictions on either side of now
  const after = curve.findIndex((p) => p.at >= now);
  const a = curve[Math.max(0, after - 1)];
  const b = curve[Math.max(0, after)];
  const span = b.at.getTime() - a.at.getTime();
  const level = span ? a.metres + ((b.metres - a.metres) * (now.getTime() - a.at.getTime())) / span : a.metres;
  const next = tides.find((t) => t.at > now);
  const ticks = curve.filter((p) => p.at.getMinutes() === 0 && Number(hour(p.at).split(' ')[0]) % 6 === 0);

  return (
    <div className="tides">
      <p className="tide-now-line">
        <span className="tide-level">{level.toFixed(1)} m</span>
        {next && (
          <span className="tide-trend" data-high={next.high || undefined}>
            {arrow(next.high)}
            {next.high ? 'Rising' : 'Falling'} to {next.metres.toFixed(1)} m at {time(next.at)}
          </span>
        )}
      </p>

      <ol className="tide-list" style={{ gridTemplateColumns: `repeat(${tides.length}, minmax(0, 1fr))` }}>
        {tides.map((tide) => (
          <li
            key={tide.at.toISOString()}
            data-high={tide.high || undefined}
            data-past={tide.at < now || undefined}
            data-next={tide === next || undefined}
          >
            <span className="tide-kind">
              {arrow(tide.high)}
              {tide.high ? 'High' : 'Low'}
            </span>
            <span className="tide-time">{time(tide.at)}</span>
            <span className="tide-height">{tide.metres.toFixed(1)} m</span>
          </li>
        ))}
      </ol>

      <svg viewBox={`0 0 ${W} ${H}`} className="tide-chart" role="img" aria-label="Tide height over the next day">
        <path d={`${path} L ${W} ${BOTTOM} L 0 ${BOTTOM} Z`} className="tide-fill" />
        <path d={path} className="tide-line" />
        {ticks.map((p) => (
          <g key={p.at.toISOString()}>
            <line x1={x(p.at)} x2={x(p.at)} y1={BOTTOM} y2={BOTTOM + 4} className="tide-tick" />
            <text x={x(p.at)} y={H - 6} className="tide-axis">
              {hour(p.at)}
            </text>
          </g>
        ))}
        {tides.map((t) => (
          <g key={t.at.toISOString()} className="tide-point" data-high={t.high || undefined}>
            <circle cx={x(t.at)} cy={y(t.metres)} r="3.5" />
            <text x={x(t.at)} y={t.high ? y(t.metres) - 9 : y(t.metres) + 17}>
              {t.metres.toFixed(1)} m
            </text>
          </g>
        ))}
        <line x1={x(now)} x2={x(now)} y1={TOP - 14} y2={BOTTOM} className="tide-now" />
        <circle cx={x(now)} cy={y(level)} r="5" className="tide-now-dot" />
        <text x={x(now)} y={TOP - 18} className="tide-now-label">
          Now
        </text>
      </svg>
    </div>
  );
}
