'use client';

import { useEffect, useState } from 'react';

const URL =
  'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=49.2827&longitude=-123.1207' +
  '&current=us_aqi,pm2_5&hourly=uv_index&timezone=America%2FVancouver&forecast_days=1';

type Air = {
  current: { us_aqi: number; pm2_5: number };
  hourly: { time: string[]; uv_index: number[] };
};

const AQI: [number, string][] = [
  [50, 'good'],
  [100, 'moderate'],
  [150, 'unhealthy for sensitive groups'],
  [200, 'unhealthy'],
  [300, 'very unhealthy'],
  [Infinity, 'hazardous'],
];
const UV: [number, string][] = [
  [3, 'low'],
  [6, 'moderate'],
  [8, 'high'],
  [11, 'very high'],
  [Infinity, 'extreme'],
];
const label = (scale: [number, string][], value: number) => scale.find(([max]) => value < max)![1];
const level = (scale: [number, string][], value: number) => {
  const i = scale.findIndex(([max]) => value < max);
  return i === 0 ? 'ok' : i === 1 ? 'warn' : 'bad';
};

// A coloured scale with a marker at the value; the last band is open-ended, so it's drawn as wide as the one before
function Meter({ scale, value }: { scale: [number, string][]; value: number }) {
  const top = scale.at(-2)![0] * 1.25;
  const edges = scale.map(([max]) => Math.min(max, top));
  return (
    <span className="meter" aria-hidden="true">
      {edges.map((max, i) => (
        <span key={i} className="meter-band" data-band={i} style={{ flexGrow: max - (edges[i - 1] ?? 0) }} />
      ))}
      <span className="meter-mark" style={{ left: `${Math.min(value / top, 1) * 100}%` }} />
    </span>
  );
}
const hour = (iso: string) => new Date(iso).toLocaleTimeString('en-CA', { hour: 'numeric' }).replace(/\.$/, '');

export default function AirAndUv() {
  const [air, setAir] = useState<Air | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(URL)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setAir)
      .catch(() => setFailed(true));
  }, []);

  if (failed) return <p className="muted">Air quality isn't available right now.</p>;
  if (!air) return <p className="muted">Loading air quality…</p>;

  const uv = air.hourly.uv_index;
  const peak = uv.reduce((best, value, i) => (value > uv[best] ? i : best), 0);
  const aqi = Math.round(air.current.us_aqi);
  const uvMax = uv[peak] ?? 0;
  const sunscreen = air.hourly.time.filter((_, i) => uv[i] >= 3);

  return (
    <div className="stat-row">
      <div className="stat" data-level={level(AQI, aqi)}>
        <span className="stat-label">Air quality now</span>
        <span className="stat-value">
          {aqi} <span className="level-pill">{label(AQI, aqi)}</span>
        </span>
        <Meter scale={AQI} value={aqi} />
        <span className="stat-note">PM2.5 {air.current.pm2_5.toFixed(0)} µg/m³</span>
      </div>
      <div className="stat" data-level={level(UV, uvMax)}>
        <span className="stat-label">UV index peak</span>
        <span className="stat-value">
          {uvMax.toFixed(0)} <span className="level-pill">{label(UV, uvMax)}</span>
        </span>
        <Meter scale={UV} value={uvMax} />
        <span className="stat-note">
          Around {hour(air.hourly.time[peak])}
          {sunscreen.length > 0 && `, sunscreen ${hour(sunscreen[0])} to ${hour(sunscreen.at(-1)!)}`}
        </span>
      </div>
    </div>
  );
}
