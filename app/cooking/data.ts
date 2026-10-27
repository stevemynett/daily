import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pagesDir } from '../_daily/data';

export type CookingRecipe = { name: string; source: string; description: string; url?: string };
export type Cooking = {
  updatedAt: string;
  // 0-11, from the "for October." footer; null when the footer is missing
  month: number | null;
  footer: string;
  plates: CookingRecipe[];
  items: { name: string; recipes: CookingRecipe[]; note: string }[];
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// `- **Name** [Source] Description. [Recipe](url)`
function parseRecipe(line: string): CookingRecipe {
  let rest = line.slice(2);
  const link = rest.match(/\s*\[[^\]]*\]\((https?:\/\/[^)]+)\)\s*$/);
  if (link) rest = rest.slice(0, link.index);
  const name = rest.match(/^\*\*(.+?)\*\*\s*/);
  if (name) rest = rest.slice(name[0].length);
  const source = rest.match(/^\[([^\]]+)\]\s*/);
  if (source) rest = rest.slice(source[0].length);
  return { name: name?.[1] ?? rest, source: source?.[1] ?? '', description: rest, url: link?.[1] };
}

// Reads ~/briefings/daily/cooking.md, which `make cooking` writes once a month
export function loadCooking(): Cooking | null {
  const file = join(pagesDir(), 'cooking.md');
  let source: string;
  try {
    source = readFileSync(file, 'utf8');
  } catch {
    return null;
  }

  const cooking: Cooking = { updatedAt: statSync(file).mtime.toISOString(), month: null, footer: '', plates: [], items: [] };
  let section: { name: string; recipes: CookingRecipe[]; note: string } | null = null;
  for (const raw of source.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('## ')) {
      section = { name: line.slice(3), recipes: [], note: '' };
      if (section.name !== 'Plates') cooking.items.push(section);
    } else if (section && line.startsWith('- ')) {
      (section.name === 'Plates' ? cooking.plates : section.recipes).push(parseRecipe(line));
    } else if (/^Generated /.test(line)) {
      cooking.footer = line;
      const month = MONTHS.findIndex((m) => line.includes(`for ${m}`));
      cooking.month = month === -1 ? null : month;
      break;
    } else if (section && line && !line.startsWith('#')) {
      section.note = line;
    }
  }
  return cooking;
}
