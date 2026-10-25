const TZ = 'America/Vancouver';
const BASE = 'https://frankiesjazzclub.turntabletickets.com';

export type FrankiesShow = {
  name: string;
  start: string;
  day: string; // YYYY-MM-DD in Vancouver
  time: string;
  price: string;
  availability: string;
  url: string;
};

type Performance = {
  datetime: string;
  show_id: number;
  availability_state: string;
  show: { name: string; price_per_person: string[] };
};

const AVAILABILITY: Record<string, string> = { sold_out: 'Sold out', limited: 'Limited', selling_fast: 'Selling fast' };

// en-CA formats as YYYY-MM-DD
const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
export const vancouverDay = (date: Date) => dayFormat.format(date);

export const formatDay = (show: FrankiesShow) =>
  new Date(show.start).toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', timeZone: TZ });

function price(prices: string[]) {
  const unique = [...new Set(prices)].map((p) => `$${p.replace(/\.00$/, '')}`);
  return unique.length > 1 ? `${unique[0]} to ${unique.at(-1)}` : (unique[0] ?? '');
}

// Shows from Frankie's ticketing site (Turntable), fetched at build. The site
// rebuilds after each scheduled run, so the list is at most a day old.
export async function loadFrankies(days = 31): Promise<FrankiesShow[] | null> {
  const from = new Date();
  const to = new Date(from.getTime() + days * 86_400_000);
  const url = `${BASE}/api/performance/?booking=true&pagination=false&start_date=${vancouverDay(from)}&end_date=${vancouverDay(to)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const { results }: { results: Performance[] } = await res.json();
    const today = vancouverDay(from);
    return results
      .map((p) => {
        const start = new Date(p.datetime);
        const day = vancouverDay(start);
        return {
          name: p.show.name.replace(/\s+/g, ' ').trim(),
          start: p.datetime,
          day,
          time: start.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', timeZone: TZ }),
          price: price(p.show.price_per_person ?? []),
          availability: AVAILABILITY[p.availability_state] ?? '',
          url: `${BASE}/shows/${p.show_id}/${day}`,
        };
      })
      .filter((s) => s.day >= today)
      .sort((a, b) => a.start.localeCompare(b.start));
  } catch {
    return null;
  }
}
