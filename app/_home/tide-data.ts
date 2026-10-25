// Canadian Hydrographic Service predictions for the Vancouver harbour station (07735). Its API
// doesn't allow browser requests, and predictions are fixed in advance, so they're fetched at build.
const STATION = 'https://api-iwls.dfo-mpo.gc.ca/api/v1/stations/5cebf1de3d0f4a073c4bb943/data';

export type TidePoint = { at: string; metres: number };
export type TideData = { hilo: TidePoint[]; curve: TidePoint[] };

async function series(code: string, from: Date, to: Date): Promise<TidePoint[]> {
  const iso = (date: Date) => `${date.toISOString().slice(0, 19)}Z`;
  const resolution = code === 'wlp' ? '&resolution=FIFTEEN_MINUTES' : '';
  const res = await fetch(`${STATION}?time-series-code=${code}${resolution}&from=${iso(from)}&to=${iso(to)}`);
  if (!res.ok) throw new Error(`${res.status}`);
  const points: { eventDate: string; value: number }[] = await res.json();
  return points.map((p) => ({ at: p.eventDate, metres: p.value }));
}

// Covers the build day plus two more, so an older build still has tonight and tomorrow
export async function loadTides(): Promise<TideData | null> {
  const from = new Date(Date.now() - 6 * 3_600_000);
  const to = new Date(Date.now() + 3 * 86_400_000);
  try {
    const [hilo, curve] = await Promise.all([series('wlp-hilo', from, to), series('wlp', from, to)]);
    return { hilo, curve };
  } catch {
    return null;
  }
}
