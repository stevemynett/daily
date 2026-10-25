// Local helper so the static site can trigger `make daily`, `make briefing` and `make records`, save
// briefing votes and track saved jobs. Caddy proxies /api/* here.
import { spawn } from 'node:child_process';
import { createWriteStream, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markets, outages } from './live.mjs';

const PORT = Number(process.env.RUNNER_PORT ?? 8787);
const RUN_HOUR = Number(process.env.RUN_HOUR ?? 6);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const briefings = process.env.BRIEFINGS_DIR ?? join(homedir(), 'briefings');
const jobsDir = process.env.JOBS_DIR ?? join(homedir(), 'Projects', 'job-hunt', 'job-search', 'output');
const logDir = join(root, '.runner');
mkdirSync(logDir, { recursive: true });

const STAMP = /^\d{4}-\d{2}-\d{2}-\d{4}$/;
const latestBriefing = () =>
  readdirSync(briefings)
    .filter((f) => f.endsWith('.md') && STAMP.test(f.slice(0, -3)))
    .sort()
    .at(-1);

// Each job is a make target; its output file's mtime is the last run
const jobs = {
  daily: { output: () => join(process.env.DAILY_DIR ?? join(briefings, 'daily'), 'events.md'), run: null },
  briefing: { output: () => join(briefings, latestBriefing()), run: null },
  records: { output: () => join(process.env.DAILY_DIR ?? join(briefings, 'daily'), 'albums.md'), run: null },
};

function lastRun(job) {
  try {
    return statSync(jobs[job].output()).mtime.toISOString();
  } catch {
    return null;
  }
}

// Durations of the last 10 successful runs per job, for the time-left estimate
const historyFile = join(logDir, 'history.json');
function loadHistory() {
  try {
    return JSON.parse(readFileSync(historyFile, 'utf8'));
  } catch {
    return {};
  }
}

function record(job, run) {
  const history = loadHistory();
  const ms = new Date(run.finishedAt) - new Date(run.startedAt);
  history[job] = [...(history[job] ?? []), ms].slice(-10);
  writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

// Median of past runs in ms, or null before the first one finishes
function estimate(job) {
  const runs = [...(loadHistory()[job] ?? [])].sort((a, b) => a - b);
  return runs.length ? runs[Math.floor(runs.length / 2)] : null;
}

function start(job) {
  const run = { startedAt: new Date().toISOString(), finishedAt: null, exitCode: null };
  jobs[job].run = run;
  const log = createWriteStream(join(logDir, `${job}.log`));
  const child = spawn('make', [job], { cwd: root });
  child.stdout.pipe(log);
  child.stderr.pipe(log);
  child.on('close', (code) => {
    run.finishedAt = new Date().toISOString();
    run.exitCode = code;
    if (code === 0) record(job, run);
    console.log(`make ${job} exited with ${code}`);
    tick();
  });
}

const running = (job) => !!jobs[job].run && jobs[job].run.finishedAt === null;
// Every job ends in `next build`, so only one runs at a time
const busy = () => Object.keys(jobs).some(running);
const status = (job) => ({
  running: running(job),
  busy: busy(),
  lastRun: lastRun(job),
  run: jobs[job].run,
  estimate: estimate(job),
});

// Today at RUN_HOUR local time, or null before then
function cutoff() {
  const at = new Date();
  at.setHours(RUN_HOUR, 0, 0, 0);
  return Date.now() >= at.getTime() ? at : null;
}

// Due when the output predates today's cutoff. One try per day, so a failing
// job doesn't rerun every check.
function due(job) {
  const at = cutoff();
  if (!at) return false;
  const last = lastRun(job);
  const tried = jobs[job].run && new Date(jobs[job].run.startedAt) >= at;
  return !tried && (!last || new Date(last) < at);
}

// Runs missed while the laptop was asleep or off start on the next check
function tick() {
  if (busy()) return;
  const job = ['briefing', 'daily', 'records'].find(due);
  if (!job) return;
  console.log(`scheduled run of make ${job}`);
  start(job);
}

function readBody(req, send, handle) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1e6) req.destroy();
  });
  req.on('end', () => {
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      return send(400, { error: 'bad json' });
    }
    handle(data);
  });
}

// scripts/claude.mjs reads these into context.md before each run
function saveFeedback(req, send) {
  readBody(req, send, (data) => {
    if (!STAMP.test(data.briefing ?? '') || !Array.isArray(data.votes)) return send(400, { error: 'bad feedback' });
    const dir = join(briefings, 'feedback');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${data.briefing}.json`), JSON.stringify(data, null, 2));
    send(200, { saved: true });
  });
}

// Saved, applied, rejected and nope jobs from the Jobs page
const trackedFile = join(jobsDir, 'saved-jobs.json');
const isMap = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

function loadTracked(send) {
  try {
    send(200, JSON.parse(readFileSync(trackedFile, 'utf8')));
  } catch {
    send(200, { saved: {}, status: {}, unsavedMissed: {} });
  }
}

function saveTracked(req, send) {
  readBody(req, send, (data) => {
    if (!isMap(data) || !['saved', 'status', 'unsavedMissed'].every((k) => isMap(data[k]))) {
      return send(400, { error: 'bad tracked jobs' });
    }
    mkdirSync(jobsDir, { recursive: true });
    writeFileSync(`${trackedFile}.tmp`, JSON.stringify(data, null, 2));
    renameSync(`${trackedFile}.tmp`, trackedFile);
    send(200, { saved: true });
  });
}

// To Read and Saved Stuff links from the Saved Tabs page, newest first
const tabsFile = join(briefings, 'saved-tabs.json');
const isTab = (tab) => isMap(tab) && /^https?:\/\//.test(tab.url) && typeof tab.why === 'string' && typeof tab.added === 'string' && ['read', 'saved'].includes(tab.list);

function loadTabs(send) {
  try {
    send(200, JSON.parse(readFileSync(tabsFile, 'utf8')));
  } catch {
    send(200, []);
  }
}

function saveTabs(req, send) {
  readBody(req, send, (data) => {
    if (!Array.isArray(data) || !data.every(isTab)) return send(400, { error: 'bad tabs' });
    mkdirSync(briefings, { recursive: true });
    writeFileSync(`${tabsFile}.tmp`, JSON.stringify(data, null, 2));
    renameSync(`${tabsFile}.tmp`, tabsFile);
    send(200, { saved: true });
  });
}

// Todos from the Todo page, newest first
const todosFile = join(briefings, 'todos.json');
const isTodo = (todo) => isMap(todo) && typeof todo.text === 'string' && typeof todo.done === 'boolean' && typeof todo.added === 'string';

function loadTodos(send) {
  try {
    send(200, JSON.parse(readFileSync(todosFile, 'utf8')));
  } catch {
    send(200, []);
  }
}

function saveTodos(req, send) {
  readBody(req, send, (data) => {
    if (!Array.isArray(data) || !data.every(isTodo)) return send(400, { error: 'bad todos' });
    writeAtomic(todosFile, JSON.stringify(data, null, 2));
    send(200, { saved: true });
  });
}

// What to watch: searches run scripts/watch.mjs, which doesn't build the site, so they don't wait
// on the daily and briefing lock. The page reads everything here at runtime.
const watchDir = join(briefings, 'watch');
const searchesDir = join(watchDir, 'searches');
const profileFile = join(watchDir, 'profile.md');
const marksFile = join(watchDir, 'marks.json');
const WATCH_TYPES = ['Any', 'Movie', 'Series'];
const VOTES = ['up', 'down'];
const STATUSES = ['want', 'watched'];
const DEFAULT_PROFILE = `We have Netflix, Crave (with HBO), Prime Video, Apple TV+ and Disney+ (with Hulu).
We mostly watch recent releases and want better picks than what the apps push at us.

Liked:

Didn't like:
`;
let watchRun = null;

const watchStatus = () => ({
  running: !!watchRun && watchRun.finishedAt === null,
  run: watchRun,
  estimate: estimate('watch'),
});

function writeAtomic(file, text) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(`${file}.tmp`, text);
  renameSync(`${file}.tmp`, file);
}

function startWatch(query, type) {
  const run = { startedAt: new Date().toISOString(), finishedAt: null, exitCode: null, query, type };
  watchRun = run;
  const log = createWriteStream(join(logDir, 'watch.log'));
  const child = spawn('node', ['scripts/watch.mjs'], {
    cwd: root,
    env: { ...process.env, WATCH_QUERY: query, WATCH_TYPE: type },
  });
  child.stdout.pipe(log);
  child.stderr.pipe(log);
  child.on('close', (code) => {
    run.finishedAt = new Date().toISOString();
    run.exitCode = code;
    if (code === 0) record('watch', run);
    console.log(`watch search exited with ${code}`);
  });
}

function loadWatch(send) {
  let profile;
  try {
    profile = readFileSync(profileFile, 'utf8');
  } catch {
    profile = DEFAULT_PROFILE;
    writeAtomic(profileFile, profile);
  }
  let marks = {};
  try {
    marks = JSON.parse(readFileSync(marksFile, 'utf8'));
  } catch {}
  mkdirSync(searchesDir, { recursive: true });
  const searches = readdirSync(searchesDir)
    .filter((f) => f.endsWith('.json') && STAMP.test(f.slice(0, -5)))
    .sort()
    .reverse()
    .flatMap((f) => {
      try {
        return [JSON.parse(readFileSync(join(searchesDir, f), 'utf8'))];
      } catch {
        return [];
      }
    });
  send(200, { profile, marks, searches, status: watchStatus() });
}

function runWatch(req, send) {
  readBody(req, send, (data) => {
    const query = typeof data.query === 'string' ? data.query.trim() : '';
    const type = data.type ?? 'Any';
    if (query.length > 500 || !WATCH_TYPES.includes(type)) return send(400, { error: 'bad search' });
    if (watchStatus().running) return send(409, watchStatus());
    startWatch(query, type);
    send(202, watchStatus());
  });
}

function saveProfile(req, send) {
  readBody(req, send, (data) => {
    if (typeof data.text !== 'string' || data.text.length > 20_000) return send(400, { error: 'bad profile' });
    writeAtomic(profileFile, data.text);
    send(200, { saved: true });
  });
}

function saveMarks(req, send) {
  readBody(req, send, (data) => {
    const isMark = (m) =>
      isMap(m) &&
      typeof m.title === 'string' &&
      (m.vote === undefined || VOTES.includes(m.vote)) &&
      (m.status === undefined || STATUSES.includes(m.status)) &&
      (m.vote || m.status);
    if (!isMap(data) || !Object.values(data).every(isMark)) {
      return send(400, { error: 'bad marks' });
    }
    writeAtomic(marksFile, JSON.stringify(data, null, 2));
    send(200, { saved: true });
  });
}

function deleteSearch(req, send) {
  readBody(req, send, (data) => {
    if (!STAMP.test(data.stamp ?? '')) return send(400, { error: 'bad stamp' });
    rmSync(join(searchesDir, `${data.stamp}.json`), { force: true });
    send(200, { deleted: true });
  });
}

createServer((req, res) => {
  const send = (code, body) => {
    res.writeHead(code, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  };
  const live = { '/api/markets': markets, '/api/outages': outages }[req.url];
  if (live && req.method === 'GET') {
    return live().then(
      (data) => send(200, data),
      (err) => send(502, { error: String(err.message ?? err) }),
    );
  }
  if (req.url === '/api/briefing/feedback' && req.method === 'POST') return saveFeedback(req, send);
  if (req.url === '/api/tabs' && req.method === 'GET') return loadTabs(send);
  if (req.url === '/api/tabs' && req.method === 'POST') return saveTabs(req, send);
  if (req.url === '/api/jobs/saved' && req.method === 'GET') return loadTracked(send);
  if (req.url === '/api/jobs/saved' && req.method === 'POST') return saveTracked(req, send);
  if (req.url === '/api/todos' && req.method === 'GET') return loadTodos(send);
  if (req.url === '/api/todos' && req.method === 'POST') return saveTodos(req, send);
  if (req.url === '/api/watch' && req.method === 'GET') return loadWatch(send);
  if (req.url === '/api/watch/status' && req.method === 'GET') return send(200, watchStatus());
  if (req.url === '/api/watch/run' && req.method === 'POST') return runWatch(req, send);
  if (req.url === '/api/watch/profile' && req.method === 'POST') return saveProfile(req, send);
  if (req.url === '/api/watch/marks' && req.method === 'POST') return saveMarks(req, send);
  if (req.url === '/api/watch/delete' && req.method === 'POST') return deleteSearch(req, send);
  const [, job, action] = req.url.match(/^\/api\/(daily|briefing|records)\/(status|run)$/) ?? [];
  if (action === 'status' && req.method === 'GET') return send(200, status(job));
  if (action === 'run' && req.method === 'POST') {
    if (busy()) return send(409, status(job));
    start(job);
    return send(202, status(job));
  }
  send(404, { error: 'not found' });
}).listen(PORT, '127.0.0.1', () => console.log(`runner listening on 127.0.0.1:${PORT}, daily runs after ${RUN_HOUR}:00`));

setTimeout(tick, 60_000);
setInterval(tick, 15 * 60_000);
