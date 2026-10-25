// Usage: node scripts/records.mjs
// New and upcoming jazz, Latin and New Orleans albums for the Records page via headless Claude.
// Writes the run to ~/briefings/records-YYYY-MM-DD-HHMM.md and the page to ~/briefings/daily/albums.md
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { briefings, done, fail, from, info, runPrompt, stamp } from './claude.mjs';

// A run that comes back this short is broken, so keep the old page instead
const MIN_ALBUMS = 20;

const file = join(briefings, `records-${stamp()}.md`);
const pagesDir = process.env.DAILY_DIR ?? join(briefings, 'daily');

info('Gathering new and upcoming album releases...');
const output = await runPrompt('records', '');
writeFileSync(file, output);

if (!output.includes('# Album releases')) fail(`No Album releases heading in output, see ${file}`);
const page = from(output, '# Album releases');
const count = page.split('\n').filter((line) => line.startsWith('- **')).length;
if (count < MIN_ALBUMS) fail(`Only ${count} albums, keeping the old page. See ${file}`);

mkdirSync(pagesDir, { recursive: true });
writeFileSync(join(pagesDir, 'albums.md'), page);
done(`Saved ${count} albums to ${file} and ${pagesDir}/albums.md`);
