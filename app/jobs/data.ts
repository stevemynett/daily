import { readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export type Job = {
  company: string;
  spaces: string[];
  title: string;
  url: string;
  location: string;
  salary: string;
  posted: string;
  check: boolean;
  postings: number;
  source: string;
  reports: 'yes' | 'no' | 'unclear' | null;
  note: string;
};
export type Tab = { name: string; summary: string; sections: { heading: string; jobs: Job[] }[] };
export type Company = { name: string; open: string; matches: string; fresh: string; status: string };
export type Report = { date: string; updatedAt: string; tabs: Tab[]; companies: Company[] };

export type List = 'saved' | 'applied' | 'rejected' | 'nope';
export type SavedJob = Pick<Job, 'company' | 'title' | 'url' | 'location' | 'salary' | 'posted' | 'check'> & {
  space: string;
  saved: string;
};
export type MissedJob = Omit<SavedJob, 'saved' | 'check'> & { added: string; reason: string };
// Same shape as the job-search HTML report's localStorage keys: job-search-saved, job-search-status
// ({url: {status, date, applied}}; applied keeps the application date while a job is rejected) and
// job-search-unsaved-missed
export type Tracked = {
  saved: Record<string, SavedJob>;
  status: Record<string, { status: Exclude<List, 'saved'>; date: string; applied?: string }>;
  unsavedMissed: Record<string, string>;
};

const REPORTS: Record<string, Job['reports']> = {
  'manages people': 'yes',
  'no reports': 'no',
  'reports unclear': 'unclear',
};

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim());

// Role cell: `[Title](url) (CHECK location) (2 postings) (from company list) (manages people: note)`
function parseRole(cell: string) {
  const link = cell.match(/^\[(.+?)\]\((\S+?)\)/);
  const role = {
    title: link?.[1] ?? cell,
    url: link?.[2] ?? '',
    check: false,
    postings: 1,
    source: '',
    reports: null as Job['reports'],
    note: '',
  };
  let rest = link ? cell.slice(link[0].length) : '';
  while ((rest = rest.trimStart()).startsWith('(')) {
    let depth = 0;
    let end = 0;
    for (; end < rest.length; end++) {
      if (rest[end] === '(') depth++;
      if (rest[end] === ')' && --depth === 0) break;
    }
    const part = rest.slice(1, end);
    rest = rest.slice(end + 1);
    const review = part.match(/^(manages people|no reports|reports unclear):\s*(.*)$/);
    if (part === 'CHECK location') role.check = true;
    else if (/^\d+ postings$/.test(part)) role.postings = Number.parseInt(part);
    else if (part.startsWith('from ')) role.source = part.slice(5);
    else if (review) {
      role.reports = REPORTS[review[1]];
      role.note = review[2];
    }
  }
  return role;
}

const jobsDir = () => process.env.JOBS_DIR ?? join(homedir(), 'Projects', 'job-hunt', 'job-search', 'output');

const readJson = <T>(file: string, fallback: T): T => {
  try {
    return JSON.parse(readFileSync(join(jobsDir(), file), 'utf8'));
  } catch {
    return fallback;
  }
};

// saved-jobs.json is written by the runner; missed-jobs.json by the missed-job skill
export function loadTracked(): { tracked: Tracked; missed: MissedJob[] } {
  const missed = readJson<MissedJob[]>('missed-jobs.json', []).map((m) => ({ ...m, space: m.space ?? '' }));
  return { tracked: readJson('saved-jobs.json', { saved: {}, status: {}, unsavedMissed: {} }), missed };
}

// Reads the newest report the job-search skill writes to output/YYYY-MM-DD-job-list.md
export function loadReport(): Report | null {
  const dir = jobsDir();
  let latest: string | undefined;
  try {
    latest = readdirSync(dir)
      .filter((file) => /^\d{4}-\d{2}-\d{2}-job-list\.md$/.test(file))
      .sort()
      .at(-1);
  } catch {
    return null;
  }
  if (!latest) return null;

  const file = join(dir, latest);
  const report: Report = { date: latest.slice(0, 10), updatedAt: statSync(file).mtime.toISOString(), tabs: [], companies: [] };
  let headers: string[] = [];
  let checked = false;
  for (const raw of readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    const tab = report.tabs.at(-1);
    const section = tab?.sections.at(-1);
    if (checked) {
      if (!line.startsWith('|') || /^\|[\s|:-]+\|$/.test(line)) continue;
      const [name, open, matches, fresh, status] = cells(line);
      if (name !== 'Company') report.companies.push({ name, open, matches, fresh, status });
    } else if (line.startsWith('## ')) {
      const name = line.slice(3);
      if (name === 'Companies checked') {
        checked = true;
        continue;
      }
      report.tabs.push({ name, summary: '', sections: [] });
    } else if (tab && line.startsWith('### ')) {
      tab.sections.push({ heading: line.slice(4), jobs: [] });
      headers = [];
    } else if (tab && !section && line && !line.startsWith('|')) {
      tab.summary = line;
    } else if (section && line.startsWith('|') && !/^\|[\s|:-]+\|$/.test(line)) {
      if (!headers.length) {
        headers = cells(line).map((header) => header.toLowerCase());
        continue;
      }
      const row = cells(line);
      const get = (header: string) => row[headers.indexOf(header)] ?? '';
      section.jobs.push({
        company: get('company'),
        spaces: get('space') ? get('space').split(', ') : [],
        location: get('location'),
        salary: get('salary') === 'not listed' ? '' : get('salary'),
        posted: get('posted'),
        ...parseRole(get('role')),
      });
    }
  }
  return report;
}
