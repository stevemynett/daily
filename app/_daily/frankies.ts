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

const SMALL = new Set(['a', 'an', 'and', 'at', 'by', 'feat', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);

// Turntable names are typed in caps. Title-case the all-caps words, leaving
// initials (J.J., LJ, MG) and words already in mixed case alone.
function titleCase(name: string) {
  return name.replace(/[A-Z][A-Z'.]*/g, (word, offset: number) => {
    if (/\./.test(word) || /^[IVX]+$/.test(word) || (word.length <= 2 && !/[AEIOUY]/.test(word))) return word;
    const lower = word.toLowerCase();
    if (offset > 0 && SMALL.has(lower) && !/[:\-/]\s*$/.test(name.slice(0, offset))) return lower;
    return lower.replace(/^(mc)?(\w)/, (_, mc = '', c) => (mc ? 'Mc' : '') + c.toUpperCase());
  });
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
          name: titleCase(p.show.name.replace(/\s+/g, ' ').trim()),
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
