// Usage: node scripts/cooking.mjs
// Seasonal recipes for the Cooking page via headless Claude, from this month's list in
// app/_home/season.ts. Writes the run to ~/briefings/cooking-YYYY-MM-DD-HHMM.md and the
// page to ~/briefings/daily/cooking.md
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SEASON } from '../app/_home/season.ts';
import { briefings, done, fail, from, info, runPrompt, stamp } from './claude.mjs';

// A run that comes back this short is broken, so keep the old page instead
const MIN_RECIPES = 25;

const file = join(briefings, `cooking-${stamp()}.md`);
const pagesDir = process.env.DAILY_DIR ?? join(briefings, 'daily');

const { produce, seafood } = SEASON[new Date().getMonth()];
const items = `Produce: ${produce.join(', ')}\nShellfish: ${seafood.join(', ')}`;

info('Gathering seasonal recipes...');
const output = await runPrompt('cooking', items);
writeFileSync(file, output);

if (!output.includes('# Cooking in season')) fail(`No Cooking in season heading in output, see ${file}`);
// Anything after the Generated line is Claude talking to the reader, not the page
const page = from(output, '# Cooking in season').replace(/(\nGenerated [^\n]*)[\s\S]*$/, '$1\n');
const count = page.split('\n').filter((line) => line.startsWith('- **')).length;
if (count < MIN_RECIPES) fail(`Only ${count} recipes, keeping the old page. See ${file}`);

mkdirSync(pagesDir, { recursive: true });
writeFileSync(join(pagesDir, 'cooking.md'), page);
done(`Saved ${count} recipes to ${file} and ${pagesDir}/cooking.md`);
