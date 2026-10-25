// Usage: node scripts/daily.mjs [days]
// Events, jazz, food scene, album releases and a photo pick via headless Claude. Writes the full run to
// ~/briefings/daily-YYYY-MM-DD-HHMM.md and one file per page to ~/briefings/daily/
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { briefings, days, done, from, info, runPrompt, stamp } from './claude.mjs';

const PAGES = {
  '# Events in Vancouver': 'events',
  '# Jazz in Vancouver': 'jazz',
  '# Vancouver food scene': 'food',
  '# Album releases': 'albums',
  '# Photo pick': 'photo',
};

const window = days(30);
const file = join(briefings, `daily-${stamp()}.md`);
const pagesDir = process.env.DAILY_DIR ?? join(briefings, 'daily');

info('Gathering events, jazz, food news, albums and a photo pick...');
const listing = from(await runPrompt('daily', window), '# Events in Vancouver');
writeFileSync(file, listing);

// Split into one stable file per page for the site to pull from
const pages = {};
let page = null;
for (const line of listing.split('\n')) {
  if (line.startsWith('# ')) page = Object.entries(PAGES).find(([heading]) => line.startsWith(heading))?.[1] ?? null;
  if (page) (pages[page] ??= []).push(line);
}

mkdirSync(pagesDir, { recursive: true });
for (const old of readdirSync(pagesDir).filter((f) => f.endsWith('.md'))) rmSync(join(pagesDir, old));
const missing = [];
for (const name of Object.values(PAGES)) {
  if (pages[name]) writeFileSync(join(pagesDir, `${name}.md`), pages[name].join('\n').trim() + '\n');
  else missing.push(name);
}
if (missing.length) console.error(`\x1b[1;31mError: No ${missing.join(', ')} section in output, see ${file}\x1b[0m`);
done(`Saved to ${file} and ${pagesDir}/{${Object.values(PAGES).join(',')}}.md`);
