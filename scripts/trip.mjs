// Usage: node scripts/trip.mjs <trip id>
// Refreshes one upcoming trip's briefing (news, events and food for its dates) via headless Claude.
// Reads the trip from ~/briefings/travel/trips.json and writes ~/briefings/travel/reports/<id>.json
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { briefings, claude, done, fail, info, root } from './claude.mjs';

const SECTIONS = ['News', 'Events', 'Food'];

const dir = join(briefings, 'travel');
const id = process.argv[2] ?? fail('usage: node scripts/trip.mjs <trip id>');

let trips;
try {
  trips = JSON.parse(readFileSync(join(dir, 'trips.json'), 'utf8'));
} catch {
  fail(`no trips saved in ${join(dir, 'trips.json')}`);
}
const trip = trips.find((t) => t.id === id) ?? fail(`no trip with id '${id}'`);

const today = new Date().toLocaleString('en-US', { timeZone: 'America/Vancouver', dateStyle: 'full', timeStyle: 'short' });
const prompt = `Today is ${today} (America/Vancouver).\n\n${readFileSync(join(root, 'prompts', 'trip.md'), 'utf8')}`
  .replaceAll('$PLACE', trip.place)
  .replaceAll('$START', trip.start)
  .replaceAll('$END', trip.end || trip.start)
  .replaceAll('$NOTES', trip.notes?.trim() || 'none');

info(`Gathering news, events and food for ${trip.place}...`);
const output = await claude(prompt, 'WebSearch WebFetch');

// The prompt asks for one json block; take the last one in case Claude printed a draft first
const block = [...output.matchAll(/```json\s*([\s\S]*?)```/g)].at(-1)?.[1] ?? output;
let report;
try {
  report = JSON.parse(block);
} catch {
  console.log(output);
  fail('could not parse the briefing as JSON');
}
const sections = (report.sections ?? [])
  .filter((s) => SECTIONS.includes(s.name) && Array.isArray(s.items))
  .map((s) => ({ name: s.name, items: s.items.filter((item) => item && typeof item.title === 'string') }));
if (!sections.some((s) => s.items.length)) {
  console.log(output);
  fail('briefing has no items');
}

mkdirSync(join(dir, 'reports'), { recursive: true });
const file = join(dir, 'reports', `${id}.json`);
writeFileSync(file, JSON.stringify({ id, generatedAt: new Date().toISOString(), summary: report.summary ?? '', sections }, null, 2));
done(`Saved ${sections.reduce((n, s) => n + s.items.length, 0)} items to ${file}`);
