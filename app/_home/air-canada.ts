// Air Canada sales and lowest fares from Vancouver, read at build time. Both pages
// are rendered on the server: the sales are offer cards in the special offers page's
// HTML, and the fares are in the route page's __NEXT_DATA__ JSON.
const SALES = 'https://www.aircanada.com/ca/en/aco/home/book/special-offers.html';
const FARES = 'https://www.aircanada.com/en-ca/flights-from-vancouver';
const UA = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
};

export type Sale = { title: string; bookBy: string; travel?: string; code?: string; url: string };
export type Fare = { city: string; price: string; trip: string; dates: string; url: string };

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;| /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const get = async (url: string) => {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.text();
};

// The page keeps expired offers, so only those whose `enddate` is still ahead
async function sales(now: Date): Promise<Sale[]> {
  const html = await get(SALES);
  const cards = html.matchAll(/<div role="listitem" id="([^"]+)" enddate="([^"]+)"[^>]*>([\s\S]*?)See offer/g);
  const result: Sale[] = [];
  for (const [, id, end, card] of cards) {
    if (new Date(end) <= now) continue;
    const title = card.match(/<p class="__pfs __bss">([\s\S]*?)<\/p>/)?.[1];
    const bookBy = card.match(/Book by:\s*([^<]+)/)?.[1];
    if (!title || !bookBy) continue;
    // Travel dates are in the offer's modal, e.g. "Travel dates: November 1, 2026 – August 31, 2027."
    const modal = html.slice(html.indexOf(`id="${id}-modal"`)).slice(0, 5000);
    const dates = text(modal).match(/Travel dates?:\s*(.*?\d{4})(?:\s*(?:[–-]|and|to)\s*(.*?\d{4}))?/);
    const travel = dates && [dates[1], dates[2]].filter(Boolean).join(' to ');
    result.push({
      title: text(title),
      bookBy: bookBy.trim(),
      travel: travel || undefined,
      code: card.match(/data-clipboard-text="([^"]+)"/)?.[1],
      url: SALES,
    });
  }
  return result;
}

type NextFare = {
  destinationCity: string;
  totalPrice: number;
  formattedTotalPrice: string;
  formattedFlightType: string;
  departureDate: string;
  returnDate: string;
  redemption: unknown;
};

// "2027-01-21" and "2027-03-02" to "Jan 21 to Mar 2, 2027"
function span(from: string, to: string) {
  const day = (iso: string, year: boolean) =>
    new Date(`${iso}T12:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(year && { year: 'numeric' }) });
  if (!to) return day(from, true);
  return `${day(from, from.slice(0, 4) !== to.slice(0, 4))} to ${day(to, true)}`;
}

// Lowest cash fares Air Canada has seen from YVR, each for one sample date; the
// cheapest per city, cheapest first
async function fares(): Promise<Fare[]> {
  const html = await get(FARES);
  const json = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!json) return [];
  const data: Record<string, { fares?: NextFare[] }> = JSON.parse(json).props.pageProps.apolloState.data;
  const all = Object.entries(data)
    .filter(([key]) => key.startsWith('StandardFareModule'))
    .flatMap(([, module]) => module.fares ?? [])
    .filter((fare) => !fare.redemption)
    .sort((a, b) => a.totalPrice - b.totalPrice)
    .filter((fare, i, list) => list.findIndex((f) => f.destinationCity === fare.destinationCity) === i);
  return all.map((fare) => ({
    city: fare.destinationCity,
    price: fare.formattedTotalPrice.replace(/ /g, ' '),
    trip: fare.formattedFlightType.toLowerCase(),
    dates: span(fare.departureDate, fare.returnDate),
    url: FARES,
  }));
}

export async function loadAirCanada(): Promise<{ sales: Sale[]; fares: Fare[] } | null> {
  try {
    const [s, f] = await Promise.all([sales(new Date()), fares()]);
    return { sales: s, fares: f };
  } catch {
    return null;
  }
}
