// WestJet sales, read at build time from the deals page. Each sale is a page
// title followed by an offer details block with the code, book-by and travel dates.
const DEALS = 'https://www.westjet.com/en-ca/deals';
const UA = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
};

export type WestJetSale = { title: string; bookBy: string; travel?: string; code?: string; url: string };

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// "October 25, 2026 (11:59 p.m. MT)" to "October 25, 2026"
const field = (block: string, label: string) =>
  text(block.match(new RegExp(`${label}:\\s*</h2>([\\s\\S]*?)</div>`))?.[1] ?? '').replace(/\s*\(.*\)$/, '') || undefined;

export async function loadWestJet(): Promise<WestJetSale[] | null> {
  try {
    const res = await fetch(DEALS, { headers: UA });
    if (!res.ok) return null;
    const html = await res.text();
    const now = new Date();
    const sales: WestJetSale[] = [];
    const blocks = html.split('<section class="com-flight-deal-offer-details');
    for (let i = 1; i < blocks.length; i++) {
      const title = [...blocks[i - 1].matchAll(/<h1>([\s\S]*?)<\/h1>/g)].at(-1)?.[1];
      const bookBy = field(blocks[i], 'Book by');
      if (!title || !bookBy) continue;
      // Keep the sale through the end of its last booking day
      if (new Date(`${bookBy} 23:59`) < now) continue;
      sales.push({
        title: text(title),
        bookBy,
        // Some sales add tiers after the overall range; keep just the range
        travel: field(blocks[i], 'Travel')
          ?.match(/^.*?\d{4}(?:\s*[–-]\s*.*?\d{4})?/)?.[0]
          .replace(/\s*[–-]\s*/, ' to '),
        code: field(blocks[i], 'Discount code'),
        url: DEALS,
      });
    }
    return sales;
  } catch {
    return null;
  }
}
