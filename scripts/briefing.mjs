// Usage: node scripts/briefing.mjs [days]
// News briefing via headless Claude, written to ~/briefings/YYYY-MM-DD-HHMM.md for the Briefing page
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { briefings, days, done, from, info, runPrompt, stamp } from './claude.mjs';

const window = days(2);
const file = join(briefings, `${stamp()}.md`);

info(`Gathering news for the last ${window} days...`);
const output = await runPrompt('briefing', window);
writeFileSync(file, from(output, '# Briefing'));
done(`Saved to ${file}`);
