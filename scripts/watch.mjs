// One "what to watch" search: fills prompts/watch.md with the request, the taste profile and past
// marks, and saves the picks to ~/briefings/watch/searches/<stamp>.json. The runner starts it with
// WATCH_QUERY and WATCH_TYPE set; `make watch Q="..."` does the same from the shell.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { briefings, claude, done, fail, info, root, stamp } from './claude.mjs';

const SERVICES = ['Netflix', 'Disney+', 'Crave', 'Prime Video', 'Apple TV+'];
const TYPES = ['Any', 'Movie', 'Series'];
const RECENT_SEARCHES = 5;

const dir = join(briefings, 'watch');
const searchesDir = join(dir, 'searches');
mkdirSync(searchesDir, { recursive: true });

const query = (process.env.WATCH_QUERY ?? '').trim();
const type = process.env.WATCH_TYPE || 'Any';
if (!TYPES.includes(type)) fail(`type must be one of ${TYPES.join(', ')}, got '${type}'`);

const read = (file, fallback) => {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return fallback;
  }
};

const marks = Object.values(JSON.parse(read(join(dir, 'marks.json'), '{}')));
const listOf = (match) =>
  marks
    .filter(match)
    .map((m) => `- ${m.title} (${m.year}, ${m.kind}, ${m.service})`)
    .join('\n') || '- none';
const marked = [
  `Thumbs up:\n${listOf((m) => m.vote === 'up')}`,
  `Thumbs down:\n${listOf((m) => m.vote === 'down')}`,
  `Want to watch:\n${listOf((m) => m.status === 'want')}`,
  `Watched:\n${listOf((m) => m.status === 'watched')}`,
].join('\n\n');

// Netflix's viewing history export (Account > Profile > Viewing activity > Download all), saved as
// netflix-history.csv. Episodes are folded into their show, most-watched first.
const plays = new Map();
for (const line of read(join(dir, 'netflix-history.csv'), '').split('\n').slice(1)) {
  const title = line.match(/^"(.*)","[^"]*"\s*$/)?.[1]?.replaceAll('""', '"').trim();
  if (!title) continue;
  const show = title.split(/: (?:Season|Series|Part|Limited Series|Chapter|Volume|Book|Collection)\b/)[0];
  plays.set(show, (plays.get(show) ?? 0) + 1);
}
const netflix =
  [...plays]
    .sort((a, b) => b[1] - a[1])
    .map(([show, n]) => `- ${show} (${n})`)
    .join('\n') || '- no history saved';

const recent =
  readdirSync(searchesDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .slice(-RECENT_SEARCHES)
    .flatMap((f) => JSON.parse(read(join(searchesDir, f), '{}')).picks ?? [])
    .map((p) => `- ${p.title} (${p.year})`)
    .join('\n') || '- none';

const today = new Date().toLocaleString('en-US', { timeZone: 'America/Vancouver', dateStyle: 'full', timeStyle: 'short' });
const prompt = `Today is ${today} (America/Vancouver).\n\n${readFileSync(join(root, 'prompts', 'watch.md'), 'utf8')}`
  .replaceAll('$QUERY', query || 'Nothing specific. Pick the best fits for their tastes.')
  .replaceAll('$TYPE', type)
  .replaceAll('$PROFILE', read(join(dir, 'profile.md'), '').trim() || 'No profile yet.')
  .replaceAll('$MARKS', marked)
  .replaceAll('$RECENT', recent)
  .replaceAll('$NETFLIX', netflix);

info(`Finding something to watch${query ? ` for "${query}"` : ''}...`);
const output = await claude(prompt, 'WebSearch WebFetch');

// The prompt asks for one json block; take the last one in case Claude printed a draft first
const block = [...output.matchAll(/```json\s*([\s\S]*?)```/g)].at(-1)?.[1] ?? output;
let picks;
try {
  picks = JSON.parse(block);
} catch {
  console.log(output);
  fail('could not parse the picks as JSON');
}
if (!Array.isArray(picks)) fail('picks are not a list');
picks = picks.filter((p) => p && typeof p.title === 'string' && SERVICES.includes(p.service));
if (!picks.length) {
  console.log(output);
  fail(`no picks on ${SERVICES.join(', ')}`);
}

const id = stamp();
const search = { stamp: id, query, type, createdAt: new Date().toISOString(), picks };
writeFileSync(join(searchesDir, `${id}.json`), JSON.stringify(search, null, 2));
done(`Saved ${picks.length} picks to ${join(searchesDir, `${id}.json`)}`);
