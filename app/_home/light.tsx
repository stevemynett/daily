'use client';

import { useEffect, useState } from 'react';
import { compass, sunDay, sunriseOver, sunsetOver, type Span, type SunDay } from './sun';

const TZ = 'America/Vancouver';
const time = (date: Date | null | undefined) =>
  date ? date.toLocaleTimeString('en-CA', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).replace(/\.$/, '') : '-';
const range = (span: Span | null) => (span ? `${time(span.start)} to ${time(span.end)}` : '-');

// Midnight today in Vancouver, whatever the browser's own timezone
function vancouverMidnight(now: Date) {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(now);
  const offset = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'longOffset' })
    .formatToParts(now)
    .find((p) => p.type === 'timeZoneName')!
    .value.replace('GMT', '');
  return new Date(`${day}T00:00:00${offset || 'Z'}`);
}

function Compass({ rise, set }: { rise: number; set: number }) {
  const point = (azimuth: number, r: number) => {
    const a = (azimuth - 90) * (Math.PI / 180);
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
  };
  const [rx, ry] = point(rise, 38);
  const [sx, sy] = point(set, 38);
  // Daylight arc runs clockwise from sunrise through south to sunset
  const large = (set - rise + 360) % 360 > 180 ? 1 : 0;
  return (
    <svg viewBox="0 0 100 100" className="sun-compass" role="img" aria-label={`Sunrise ${Math.round(rise)}°, sunset ${Math.round(set)}°`}>
      <circle cx="50" cy="50" r="38" className="sun-compass-ring" />
      <path d={`M ${rx} ${ry} A 38 38 0 ${large} 1 ${sx} ${sy}`} className="sun-compass-day" />
      <line x1="50" y1="50" x2={rx} y2={ry} className="sun-compass-ray" />
      <line x1="50" y1="50" x2={sx} y2={sy} className="sun-compass-ray" />
      <circle cx={rx} cy={ry} r="4" className="sun-compass-sun" />
      <circle cx={sx} cy={sy} r="4" className="sun-compass-sun" data-set />
      {(['N', 'E', 'S', 'W'] as const).map((label, i) => {
        const [x, y] = point(i * 90, 47);
        return (
          <text key={label} x={x} y={y} className="sun-compass-label" textAnchor="middle" dominantBaseline="central">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// Worked out in the browser for today, so nothing needs fetching
export default function Light() {
  const [sun, setSun] = useState<SunDay | null>(null);
  useEffect(() => setSun(sunDay(vancouverMidnight(new Date()))), []);
  if (!sun) return null;

  const rows = [
    ['Blue hour', range(sun.blueMorning)],
    ['Sunrise', time(sun.sunrise)],
    ['Golden hour', range(sun.goldenMorning)],
    ['Golden hour', range(sun.goldenEvening)],
    ['Sunset', time(sun.sunset)],
    ['Blue hour', range(sun.blueEvening)],
  ];

  return (
    <div className="light">
      <dl className="light-times">
        {rows.map(([label, value], i) => (
          <div key={i} data-part={i < 3 ? 'morning' : 'evening'}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {sun.sunriseAzimuth !== null && sun.sunsetAzimuth !== null && (
        <div className="light-direction">
          <Compass rise={sun.sunriseAzimuth} set={sun.sunsetAzimuth} />
          <p>
            Rises in the {compass(sun.sunriseAzimuth)} ({Math.round(sun.sunriseAzimuth)}°),{' '}
            {sunriseOver(sun.sunriseAzimuth)}. Sets in the {compass(sun.sunsetAzimuth)} (
            {Math.round(sun.sunsetAzimuth)}°), {sunsetOver(sun.sunsetAzimuth)}.
          </p>
        </div>
      )}
    </div>
  );
}
