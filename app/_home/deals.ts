// Latest posts from YVR Deals, read from its homepage at build time since it has no feed
export type Deal = { title: string; url: string; price?: string; dates?: string };

const DEAL = /<a href="(https:\/\/yvrdeals\.com\/[a-z0-9-]+)" title="([^"]+)"/g;

const decode = (text: string) =>
  text
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"');

// "Vancouver (and other cities in B.C.) to Paris, France - $525 to $614 CAD roundtrip including taxes"
// becomes "Paris, France" and "$525 to $614"
function parseTitle(title: string) {
  const match = title.match(/^.*?\bto (.+?) - (\$[\d,]+(?: to \$[\d,]+)?)/);
  return match ? { title: match[1], price: match[2] } : { title };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const UA = { 'user-agent': 'Mozilla/5.0 (daily dashboard)' };

const text = (html: string) =>
  decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');

// Each post says "Availability for travel August, September 2026 January, February 2027";
// the year follows its months. Returns the span from this month on, like "Nov 2026 to Mar 2027".
function travelMonths(post: string, now: Date) {
  const line = post.match(/Availability for travel (.*?) How to/)?.[1];
  if (!line) return undefined;
  const months: number[] = [];
  let pending: number[] = [];
  for (const word of line.split(/[\s,]+/)) {
    const month = MONTHS.indexOf(word.slice(0, 3));
    if (month !== -1 && /^[A-Z][a-z]+$/.test(word)) pending.push(month);
    else if (/^\d{4}$/.test(word)) {
      months.push(...pending.map((m) => Number(word) * 12 + m));
      pending = [];
    }
  }
  const from = now.getFullYear() * 12 + now.getMonth();
  const ahead = months.filter((m) => m >= from).sort((a, b) => a - b);
  if (ahead.length === 0) return undefined;
  const label = (m: number) => `${MONTHS[m % 12]} ${Math.floor(m / 12)}`;
  const first = label(ahead[0]);
  const last = label(ahead.at(-1)!);
  return first === last ? first : `${first} to ${last}`;
}

// Posts that list exact date pairs ("[Dates To Try] Dec 3 to Dec 9, 10 ..."):
// the first departure to the last return
function datePairs(post: string) {
  const list = post.match(/\[(?:Dates To Try|Remaining Dates|Dates)\](.*?)(?:\[|\d\. Go to|Can.t find)/)?.[1];
  if (!list) return undefined;
  const first = list.match(/[A-Z][a-z]{2} \d{1,2}/)?.[0];
  let month = '';
  let last = '';
  for (const [, m, d] of list.matchAll(/(?:([A-Z][a-z]{2}) )?(\d{1,2})\b/g)) {
    if (m) month = m;
    last = `${month} ${d}`;
  }
  return first && last && first !== last ? `${first} to ${last}` : first;
}

async function travelDates(url: string, now: Date) {
  try {
    const res = await fetch(url, { headers: UA });
    if (!res.ok) return undefined;
    const post = text(await res.text());
    return datePairs(post) ?? travelMonths(post, now);
  } catch {
    return undefined;
  }
}

export async function loadDeals(limit = 8): Promise<Deal[] | null> {
  try {
    const res = await fetch('https://yvrdeals.com/', { headers: UA });
    if (!res.ok) return null;
    const html = await res.text();
    const seen = new Set<string>();
    const deals: Deal[] = [];
    for (const [, url, title] of html.matchAll(DEAL)) {
      if (seen.has(url)) continue;
      seen.add(url);
      deals.push({ url, ...parseTitle(decode(title)) });
    }
    const latest = deals.slice(0, limit);
    const now = new Date();
    const dates = await Promise.all(latest.map((deal) => travelDates(deal.url, now)));
    return latest.map((deal, i) => ({ ...deal, dates: dates[i] }));
  } catch {
    return null;
  }
}
