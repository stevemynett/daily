// YVR Deals posts, Air Canada and WestJet sales and Air Canada's lowest fares in one
// list. Anything flying to or connecting through the US is left out.
import { loadAirCanada } from './air-canada';
import { loadDeals } from './deals';
import { loadWestJet } from './westjet';

export type Trip = { title: string; url: string; price?: string; source: string; details: string[] };

const US = new RegExp(
  [
    '\\bU\\.?S\\.?A?\\b',
    'United States',
    'Hawai',
    'Alaska',
    'Florida',
    'California',
    'Arizona',
    'Nevada',
    'Texas',
    'Seattle',
    'Portland',
    'San Francisco',
    'Los Angeles',
    'San Diego',
    'Palm Springs',
    'Phoenix',
    'Las Vegas',
    'Denver',
    'Dallas',
    'Houston',
    'Austin',
    'Chicago',
    'Minneapolis',
    'Detroit',
    'Atlanta',
    'Orlando',
    'Miami',
    'Tampa',
    'Fort Lauderdale',
    'Fort Myers',
    'Nashville',
    'New Orleans',
    'Boston',
    'New York',
    'Newark',
    'Washington',
    'Philadelphia',
    'Charlotte',
    'Salt Lake',
    'Honolulu',
    'Maui',
    'Kona',
    'San Juan',
    'Puerto Rico',
  ].join('|'),
  'i',
);

const dollars = (price: string) => Number(price.replace(/[^\d.]/g, '').split('.')[0]) || Infinity;
const cheapest = (trip: Trip) => (trip.price ? dollars(trip.price.split(' to ')[0]) : Infinity);

// The home page shows the latest few; the Travel page asks for more so watchers have more to match
export async function loadTravel({ deals: dealLimit = 8, fares: fareLimit = 8 } = {}): Promise<Trip[] | null> {
  const [deals, airCanada, westJet] = await Promise.all([loadDeals(dealLimit), loadAirCanada(), loadWestJet()]);
  if (!deals && !airCanada && !westJet) return null;

  // Sales come first since they have a booking deadline, then fares cheapest first
  const sales: Trip[] = [
    ...(airCanada?.sales ?? []).map((sale) => ({ ...sale, source: 'Air Canada sale' })),
    ...(westJet ?? []).map((sale) => ({ ...sale, source: 'WestJet sale' })),
  ]
    .filter((sale) => !US.test(sale.title))
    .map(({ title, url, source, travel, bookBy, code }) => ({
      title,
      url,
      source,
      details: [travel && `Travel ${travel}`, `Book by ${bookBy}`, code && `Code ${code}`].filter((d): d is string => !!d),
    }));

  const fares: Trip[] = [
    ...(deals ?? [])
      .filter((deal) => !US.test(`${deal.title} ${deal.stops ?? ''}`))
      .map((deal) => ({
        title: deal.title,
        url: deal.url,
        price: deal.price && `${deal.price} round-trip`,
        source: 'YVR Deals',
        details: [deal.dates && `Travel ${deal.dates}`, deal.stops && `Stop in ${deal.stops}`].filter((d): d is string => !!d),
      })),
    ...(airCanada?.fares ?? [])
      .filter((fare) => !US.test(fare.city))
      .slice(0, fareLimit)
      .map((fare) => ({
        title: fare.city,
        url: fare.url,
        price: `${fare.price.replace(/^CAD\s*/, '$')} ${fare.trip}`,
        source: 'Air Canada fare',
        details: [fare.dates],
      })),
  ].sort((a, b) => cheapest(a) - cheapest(b));

  return [...sales, ...fares];
}
