// Sun position from the NOAA low-precision formulas, good to about a tenth of a degree
const RAD = Math.PI / 180;
export const VANCOUVER = { lat: 49.2827, lon: -123.1207 };

export function sunPosition(date: Date, lat = VANCOUVER.lat, lon = VANCOUVER.lon) {
  const n = date.getTime() / 86_400_000 + 2440587.5 - 2451545.0;
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * RAD;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const eps = (23.439 - 0.0000004 * n) * RAD;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const gmst = (280.46061837 + 360.98564736629 * n) % 360;
  const h = (gmst + lon) * RAD - ra;
  const phi = lat * RAD;
  const elevation = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(h)) / RAD;
  const azimuth =
    (Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)) / RAD + 180 + 360) % 360;
  return { elevation, azimuth };
}

export type Span = { start: Date; end: Date };
export type SunDay = {
  sunrise: Date | null;
  sunset: Date | null;
  sunriseAzimuth: number | null;
  sunsetAzimuth: number | null;
  blueMorning: Span | null;
  goldenMorning: Span | null;
  goldenEvening: Span | null;
  blueEvening: Span | null;
};

// Scans the day a minute at a time from `midnight`. Golden hour is the sun between 6° above and
// 4° below the horizon, blue hour between 4° and 6° below; sunrise and sunset use -0.833° for refraction.
export function sunDay(midnight: Date): SunDay {
  const samples = Array.from({ length: 24 * 60 + 1 }, (_, i) => {
    const at = new Date(midnight.getTime() + i * 60_000);
    return { at, ...sunPosition(at) };
  });
  const noon = samples.reduce((best, s) => (s.elevation > best.elevation ? s : best));
  const morning = samples.filter((s) => s.at <= noon.at);
  const evening = samples.filter((s) => s.at >= noon.at);

  const span = (list: typeof samples, low: number, high: number): Span | null => {
    const inside = list.filter((s) => s.elevation >= low && s.elevation < high);
    return inside.length ? { start: inside[0].at, end: inside.at(-1)!.at } : null;
  };
  const rise = morning.find((s) => s.elevation >= -0.833) ?? null;
  const set = [...evening].reverse().find((s) => s.elevation >= -0.833) ?? null;

  return {
    sunrise: rise?.at ?? null,
    sunset: set?.at ?? null,
    sunriseAzimuth: rise?.azimuth ?? null,
    sunsetAzimuth: set?.azimuth ?? null,
    blueMorning: span(morning, -6, -4),
    goldenMorning: span(morning, -4, 6),
    goldenEvening: span(evening, -4, 6),
    blueEvening: span(evening, -6, -4),
  };
}

const POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
export const compass = (azimuth: number) => POINTS[Math.round(azimuth / 22.5) % 16];

// Rough bearings from downtown: Mount Baker is about 120°, Bowen Island about 300°
export function sunriseOver(azimuth: number) {
  if (azimuth >= 113 && azimuth <= 128) return 'near Mount Baker';
  if (azimuth < 80) return 'over the North Shore mountains and Indian Arm';
  return 'over Burnaby and the Fraser Valley';
}

export function sunsetOver(azimuth: number) {
  if (azimuth < 250) return 'over the Strait of Georgia toward Vancouver Island';
  if (azimuth < 290) return 'straight out over English Bay';
  return 'toward Bowen Island and Howe Sound';
}
