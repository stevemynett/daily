import { readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export type BriefingItem = { headline: string; meta: string; summary: string; url: string };
export type BriefingSection = { heading: string; items: BriefingItem[]; note: string };
export type Vote = {
  id: string;
  kind: 'item' | 'section';
  section: string;
  headline?: string;
  meta?: string;
  url?: string;
  vote: 1 | -1;
};
export type Feedback = { briefing: string; votes: Vote[]; notes: string };
export type Briefing = {
  stamp: string;
  title: string;
  updatedAt: string;
  footer: string;
  sections: BriefingSection[];
  feedback: Feedback | null;
};

// `- **Headline** (Source, Mon D): summary. <URL>`
const ITEM = /^- \*\*(.+?)\*\* \((.+?)\):\s*(.*?)\s*<?(https?:\/\/[^\s>]+)>?\s*$/;
const STAMP = /^\d{4}-\d{2}-\d{2}-\d{4}$/;

export const briefingsDir = () => process.env.BRIEFINGS_DIR ?? join(homedir(), 'briefings');

// Reads the newest ~/briefings/YYYY-MM-DD-HHMM.md the `briefing` CLI writes
export function loadBriefing(): Briefing | null {
  const dir = briefingsDir();
  let stamps: string[];
  try {
    stamps = readdirSync(dir)
      .filter((f) => f.endsWith('.md') && STAMP.test(f.slice(0, -3)))
      .map((f) => f.slice(0, -3))
      .sort();
  } catch {
    return null;
  }
  const stamp = stamps.at(-1);
  if (!stamp) return null;

  const file = join(dir, `${stamp}.md`);
  const briefing: Briefing = {
    stamp,
    title: '',
    updatedAt: statSync(file).mtime.toISOString(),
    footer: '',
    sections: [],
    feedback: null,
  };
  const seen = new Set<string>();
  // Food and drink has its own page; older briefings still include the section
  let skip = false;
  for (const raw of readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    const section = briefing.sections.at(-1);
    if (line.startsWith('# ')) {
      briefing.title = line.slice(2);
    } else if (line.startsWith('## ')) {
      skip = line.slice(3) === 'Food and drink';
      if (!skip) briefing.sections.push({ heading: line.slice(3), items: [], note: '' });
    } else if (skip) {
      continue;
    } else if (/^_.*_$/.test(line)) {
      briefing.footer = line.slice(1, -1);
    } else if (section && line) {
      const m = line.match(ITEM);
      if (!m) {
        section.note = line.replace(/^- /, '');
      } else if (!seen.has(m[4])) {
        seen.add(m[4]);
        section.items.push({ headline: m[1], meta: m[2], summary: m[3].replace(/\*\*/g, ''), url: m[4] });
      }
    }
  }

  try {
    briefing.feedback = JSON.parse(readFileSync(join(dir, 'feedback', `${stamp}.json`), 'utf8'));
  } catch {}
  return briefing;
}
