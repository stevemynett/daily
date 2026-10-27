import { readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export type ListingItem = {
  name: string;
  category?: string;
  where: string;
  description: string;
  url?: string;
  tickets?: 'Sold out' | 'Tickets available';
  release?: 'New' | 'Reissue';
};
export type Listing = {
  updatedAt: string;
  note: string;
  footer: string;
  groups: { heading: string; items: ListingItem[] }[];
};

export type Page = 'events' | 'jazz' | 'food' | 'albums' | 'photo';

export const pagesDir = () => process.env.DAILY_DIR ?? join(homedir(), 'briefings', 'daily');

// `- **Name** [Category] Where, when. Description. (Sold out) [Tickets](url)`; the
// ticket status is optional and the daily skill only adds it to ticketed events
function parseItem(line: string): ListingItem {
  let rest = line.slice(2);
  const link = rest.match(/\s*\[[^\]]*\]\((https?:\/\/[^)]+)\)\s*$/);
  if (link) rest = rest.slice(0, link.index);
  const tickets = rest.match(/\s*\((Sold out|Tickets available)\)\s*$/i);
  if (tickets) rest = rest.slice(0, tickets.index);
  const release = rest.match(/\s*\((New|Reissue)\)\s*$/i);
  if (release) rest = rest.slice(0, release.index);
  const name = rest.match(/^\*\*(.+?)\*\*\s*/);
  if (name) rest = rest.slice(name[0].length);
  const category = rest.match(/^\[([^\]]+)\]\s*/);
  if (category) rest = rest.slice(category[0].length);
  const split = rest.indexOf('. ');
  return {
    name: name?.[1] ?? rest,
    category: category?.[1],
    where: split === -1 ? rest : rest.slice(0, split),
    description: split === -1 ? '' : rest.slice(split + 2),
    url: link?.[1],
    tickets: tickets ? (/sold/i.test(tickets[1]) ? 'Sold out' : 'Tickets available') : undefined,
    release: release ? (/reissue/i.test(release[1]) ? 'Reissue' : 'New') : undefined,
  };
}

// Pro sports only. The prompt already says so; this catches university and
// college games that slip through anyway.
const UNIVERSITY = /\b(UBC|SFU|Thunderbirds|Red Leafs|Trinity Western|Spartans|U SPORTS|USports|Canada West|GNAC|NCAA|university|college|varsity)\b/i;
const isUniversitySport = (item: ListingItem) =>
  item.category === 'Sports' && UNIVERSITY.test(`${item.name} ${item.where} ${item.description}`);

// Albums from runs before the (New)/(Reissue) marker: guess from the description,
// which names reissues and gives the original year of old recordings (but not
// "first album since 2014")
const REISSUE = /\b(reissue[sd]?|remaster(ed)?|archival|previously unreleased|anniversary edition|re-?pressing|(?<!(since|between|and) )(19[0-9]{2}|200[0-9]|201[0-5])\b(?! tour))/i;
const releaseOf = (item: ListingItem) =>
  item.release ?? (REISSUE.test(`${item.name} ${item.description}`) ? 'Reissue' : 'New');

// Album names open in the Spotify app: the album itself when the listing links
// its open.spotify.com page, otherwise a Spotify search for "Artist Album"
function spotifyLink(item: ListingItem) {
  const album = item.url?.match(/open\.spotify\.com\/(?:intl-\w+\/)?album\/(\w+)/);
  if (album) return `spotify:album:${album[1]}`;
  return `spotify:search:${encodeURIComponent(item.name.replace(/,/g, ''))}`;
}

// Reads one of the per-page files the `daily` CLI writes to ~/briefings/daily/
export function loadListing(page: Page): Listing | null {
  const file = join(pagesDir(), `${page}.md`);
  let source: string;
  try {
    source = readFileSync(file, 'utf8');
  } catch {
    return null;
  }

  const listing: Listing = { updatedAt: statSync(file).mtime.toISOString(), note: '', footer: '', groups: [] };
  for (const raw of source.split('\n')) {
    const line = raw.trim();
    const group = listing.groups.at(-1);
    if (line.startsWith('## ')) {
      listing.groups.push({ heading: line.slice(3), items: [] });
    } else if (group && line.startsWith('- ')) {
      const item = parseItem(line);
      if (page === 'albums') {
        item.release = releaseOf(item);
        item.url = spotifyLink(item);
      }
      if (!isUniversitySport(item)) group.items.push(item);
    } else if (/^_?Generated /.test(line)) {
      // Anything after the footer is Claude talking to the reader, not listing
      listing.footer = line.replace(/^_|_$/g, '');
      break;
    } else if (line && !line.startsWith('#')) {
      listing.note = line;
    }
  }
  return listing;
}
