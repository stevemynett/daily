import { readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export type ListingItem = {
  name: string;
  category?: string;
  where: string;
  description: string;
  url?: string;
};
export type Listing = {
  updatedAt: string;
  note: string;
  footer: string;
  groups: { heading: string; items: ListingItem[] }[];
};

export type Page = 'events' | 'food' | 'albums' | 'photo';

export const pagesDir = () => process.env.DAILY_DIR ?? join(homedir(), 'briefings', 'daily');

// `- **Name** [Category] Where, when. Description. [Info](url)`
function parseItem(line: string): ListingItem {
  let rest = line.slice(2);
  const link = rest.match(/\s*\[[^\]]*\]\((https?:\/\/[^)]+)\)\s*$/);
  if (link) rest = rest.slice(0, link.index);
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
  };
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
      group.items.push(parseItem(line));
    } else if (/^_?Generated /.test(line)) {
      listing.footer = line.replace(/^_|_$/g, '');
    } else if (line && !line.startsWith('#')) {
      listing.note = line;
    }
  }
  return listing;
}
