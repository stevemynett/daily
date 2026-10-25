'use client';

import { useEffect, useState } from 'react';
import RainChart from './rain-chart';

const URL =
  'https://api.open-meteo.com/v1/forecast?latitude=49.2827&longitude=-123.1207' +
  '&current=temperature_2m,apparent_temperature,weather_code' +
  '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunset' +
  '&hourly=precipitation_probability,precipitation,temperature_2m,weather_code' +
  '&timezone=America%2FVancouver&forecast_days=1';

type Forecast = {
  current: { time: string; temperature_2m: number; apparent_temperature: number; weather_code: number };
  daily: {
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    precipitation_sum: number[];
    sunset: string[];
  };
  hourly: {
    time: string[];
    precipitation_probability: number[];
    precipitation: number[];
    temperature_2m: number[];
    weather_code: number[];
  };
};

// WMO weather codes, as Open-Meteo reports them
const CODES: [number[], string][] = [
  [[0], 'Clear'],
  [[1], 'Mostly clear'],
  [[2], 'Partly cloudy'],
  [[3], 'Overcast'],
  [[45, 48], 'Fog'],
  [[51, 53, 55], 'Drizzle'],
  [[56, 57], 'Freezing drizzle'],
  [[61], 'Light rain'],
  [[63], 'Rain'],
  [[65], 'Heavy rain'],
  [[66, 67], 'Freezing rain'],
  [[71, 73, 75, 77], 'Snow'],
  [[80, 81], 'Showers'],
  [[82], 'Heavy showers'],
  [[85, 86], 'Snow showers'],
  [[95, 96, 99], 'Thunderstorms'],
];
const describe = (code: number) => CODES.find(([codes]) => codes.includes(code))?.[1] ?? 'Unknown';
const deg = (n: number) => `${Math.round(n)}°`;

const rainLevel = (chance: number) => (chance <= 20 ? 'ok' : chance < 50 ? 'warn' : 'bad');

const hourLabel = (iso: string) => new Date(iso).toLocaleTimeString('en-CA', { hour: 'numeric' }).replace(/\.$/, '');

// Fetched live in the browser so it's current even when the build is old
export default function Weather() {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(URL)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setForecast)
      .catch(() => setFailed(true));
  }, []);

  if (failed) return <p className="muted">Weather isn't available right now.</p>;
  if (!forecast) return <p className="muted">Loading weather…</p>;

  const { current, daily, hourly } = forecast;
  const hours = hourly.time.map((time, i) => ({
    time,
    chance: hourly.precipitation_probability[i] ?? 0,
    mm: hourly.precipitation[i] ?? 0,
  }));
  const now = Math.max(0, hourly.time.findIndex((t) => t.slice(0, 13) === current.time.slice(0, 13)));
  const sunset = new Date(daily.sunset[0]).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' });
  // Rest of the day, so it matches the chart's highlighted bars rather than hours already gone
  const ahead = hours.slice(now);
  const chance = Math.max(0, ...ahead.map((h) => h.chance));
  const rain = ahead.reduce((sum, h) => sum + h.mm, 0);
  const today = describe(daily.weather_code[0]);
  const strip = hourly.time.map((time, i) => ({ time, i })).slice(now);

  return (
    <div className="weather">
      <div className="weather-head">
        <div className="weather-now">
          <span className="weather-temp">{deg(current.temperature_2m)}</span>
          <span className="weather-sky">
            {describe(current.weather_code)}
            <span>
              Feels like {deg(current.apparent_temperature)}
              {today !== describe(current.weather_code) && ` · ${today} today`}
            </span>
          </span>
        </div>
        <dl className="weather-stats">
          <div>
            <dt>High / low</dt>
            <dd>
              {deg(daily.temperature_2m_max[0])} / {deg(daily.temperature_2m_min[0])}
            </dd>
          </div>
          <div data-level={rainLevel(chance)}>
            <dt>Rain rest of day</dt>
            <dd>
              {chance}%{rain >= 0.1 && <span> · {rain.toFixed(1)} mm</span>}
            </dd>
          </div>
          <div>
            <dt>Sunset</dt>
            <dd>{sunset}</dd>
          </div>
        </dl>
      </div>
      <RainChart hours={hours} now={now} />
      <ol className="hourly">
        {strip.map(({ time, i }) => (
          <li key={time} data-now={i === now || undefined} data-level={rainLevel(hourly.precipitation_probability[i] ?? 0)}>
            <span className="hourly-time">{i === now ? 'Now' : hourLabel(time)}</span>
            <span className="hourly-temp">{deg(hourly.temperature_2m[i])}</span>
            <span className="hourly-sky">{describe(hourly.weather_code[i])}</span>
            <span className="hourly-rain">{hourly.precipitation_probability[i]}%</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
