// Shared pieces of the briefing and daily jobs: the feedback context file and the headless Claude run
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const briefings = process.env.BRIEFINGS_DIR ?? join(homedir(), 'briefings');

const ITEM = /^- \*\*(.+?)\*\* \((.+?)\):.*?<?(https?:\/\/[^\s>]+)>?\s*$/;
const MAX_ITEMS = 40;
const RECENT_BRIEFINGS = 2;

export const fail = (message) => {
  console.error(`\x1b[1;31mError: ${message}\x1b[0m`);
  process.exit(1);
};
export const info = (message) => console.log(`\x1b[1;34m${message}\x1b[0m`);
export const done = (message) => console.log(`\x1b[1;32m${message}\x1b[0m`);

export function days(fallback) {
  const arg = process.argv[2] ?? String(fallback);
  if (!/^\d+$/.test(arg)) fail(`days must be a number, got '${arg}'`);
  return arg;
}

export const stamp = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
};

// Writes context.md from the votes the Briefing page saves to feedback/ and the last two briefings' links
function writeContext() {
  const store = join(briefings, 'feedback');
  mkdirSync(store, { recursive: true });

  const sections = new Map();
  const liked = [];
  const disliked = [];
  const notes = [];
  for (const file of readdirSync(store).filter((f) => f.endsWith('.json')).sort()) {
    const data = JSON.parse(readFileSync(join(store, file), 'utf8'));
    for (const v of data.votes ?? []) {
      if (v.kind === 'section') {
        const [up, down] = sections.get(v.section) ?? [0, 0];
        sections.set(v.section, [up + (v.vote > 0), down + (v.vote < 0)]);
      } else {
        (v.vote > 0 ? liked : disliked).push(`- [${v.section}] ${v.headline} (${v.meta ?? ''})`);
      }
    }
    if (data.notes?.trim()) notes.push(`- (${data.briefing}) ${data.notes.trim()}`);
  }

  const out = ['## Reader feedback', ''];
  if (!sections.size && !liked.length && !disliked.length && !notes.length) {
    out.push('No feedback yet.', '');
  } else {
    if (sections.size) {
      out.push('Section votes (up / down):');
      for (const [s, [up, down]] of [...sections].sort()) out.push(`- ${s}: ${up} / ${down}`);
      out.push('');
    }
    for (const [label, items] of [
      ['Liked items:', liked],
      ['Disliked items:', disliked],
      ['Notes:', notes],
    ]) {
      if (items.length) out.push(label, ...items.slice(-MAX_ITEMS), '');
    }
  }

  out.push('## Already covered', '');
  const recent = readdirSync(briefings)
    .filter((f) => /^20.*\.md$/.test(f))
    .sort()
    .slice(-RECENT_BRIEFINGS);
  for (const file of recent) {
    for (const line of readFileSync(join(briefings, file), 'utf8').split('\n')) {
      const m = line.match(ITEM);
      if (m) out.push(`- ${m[1]} <${m[3]}>`);
    }
  }
  writeFileSync(join(briefings, 'context.md'), out.join('\n') + '\n');
}

// Fills in the prompt from prompts/<name>.md and returns Claude's text output
export async function runPrompt(name, days) {
  mkdirSync(briefings, { recursive: true });
  try {
    writeContext();
  } catch (err) {
    console.error(`\x1b[1;31mError: Failed to collect feedback, continuing without it (${err.message})\x1b[0m`);
  }

  const today = new Date().toLocaleString('en-US', {
    timeZone: 'America/Vancouver',
    dateStyle: 'full',
    timeStyle: 'short',
  });
  const prompt = `Today is ${today} (America/Vancouver).\n\n${readFileSync(join(root, 'prompts', `${name}.md`), 'utf8')}`
    .replaceAll('$ARGUMENTS', days)
    .replaceAll('~/briefings', briefings);

  return claude(prompt, 'WebSearch WebFetch Task Read');
}

// Runs a headless Claude with the given tools and returns its text output
export function claude(prompt, tools) {
  const args = ['-p', prompt, '--allowedTools', tools, '--add-dir', briefings, '--output-format', 'text'];
  return new Promise((resolve) => {
    const child = spawn('claude', args, { stdio: ['ignore', 'pipe', 'inherit'] });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.on('error', () => fail('claude not found on PATH'));
    child.on('close', (code) => {
      if (code !== 0) {
        console.log(output);
        fail('claude exited with an error');
      }
      resolve(output);
    });
  });
}

// Drops any status chatter before the first heading. Claude sometimes prints the whole document
// twice, so start from the last copy.
export function from(output, heading) {
  const at = output.lastIndexOf(heading);
  return (at === -1 ? output : output.slice(at)).trim() + '\n';
}
