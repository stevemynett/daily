// Local helper so the static site can trigger `make daily`, `make briefing` and `make records`, save
// briefing votes and track saved jobs. Caddy proxies /api/* here.
import { spawn } from 'node:child_process';
import { createWriteStream, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
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
  // Monthly, since the in-season list only changes with the month
  cooking: { output: () => join(process.env.DAILY_DIR ?? join(briefings, 'daily'), 'cooking.md'), run: null, monthly: true },
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

// Today (or the 1st, for monthly jobs) at RUN_HOUR local time, or null before then
function cutoff(job) {
  const at = new Date();
  if (jobs[job].monthly) at.setDate(1);
  at.setHours(RUN_HOUR, 0, 0, 0);
  return Date.now() >= at.getTime() ? at : null;
}

// Due when the output predates today's cutoff. One try per day, so a failing
// job doesn't rerun every check.
function due(job) {
  const at = cutoff(job);
  if (!at) return false;
  const last = lastRun(job);
  const tried = jobs[job].run && new Date(jobs[job].run.startedAt) >= at;
  return !tried && (!last || new Date(last) < at);
}

// Runs missed while the laptop was asleep or off start on the next check
function tick() {
  if (busy()) return;
  const job = ['briefing', 'daily', 'records', 'cooking'].find(due);
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

function writeAtomic(file, text) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(`${file}.tmp`, text);
  renameSync(`${file}.tmp`, file);
}

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

// Travel: deal watchers and upcoming trips from the Travel page. Each trip gets a briefing from
// scripts/trip.mjs, which doesn't build the site, so trip runs don't wait on the job lock.
const travelDir = join(briefings, 'travel');
const watchersFile = join(travelDir, 'watchers.json');
const tripsFile = join(travelDir, 'trips.json');
const reportsDir = join(travelDir, 'reports');
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TRIP_ID = /^[a-z0-9-]{1,80}$/;
const DAY = 24 * 60 * 60 * 1000;
let tripRun = null;

const readJson = (file, fallback) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
};
const isWatcher = (w) => isMap(w) && typeof w.terms === 'string' && w.terms.trim() && (w.maxPrice === undefined || typeof w.maxPrice === 'number');
const isTrip = (t) =>
  isMap(t) && TRIP_ID.test(t.id ?? '') && typeof t.place === 'string' && DATE.test(t.start ?? '') && (!t.end || DATE.test(t.end));
const tripStatus = () => ({ running: !!tripRun && tripRun.finishedAt === null, run: tripRun, estimate: estimate('trip') });
const localDate = (date = new Date()) => date.toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' });

function startTrip(id) {
  const run = { id, startedAt: new Date().toISOString(), finishedAt: null, exitCode: null };
  tripRun = run;
  const log = createWriteStream(join(logDir, 'trip.log'));
  const child = spawn('node', ['scripts/trip.mjs', id], { cwd: root });
  child.stdout.pipe(log);
  child.stderr.pipe(log);
  child.on('close', (code) => {
    run.finishedAt = new Date().toISOString();
    run.exitCode = code;
    if (code === 0) record('trip', run);
    console.log(`trip ${id} exited with ${code}`);
    tripTick();
  });
}

// Briefings refresh weekly, then daily in the two weeks before a trip, and stop once it's over.
// One try per trip per day, so a failing one doesn't rerun every check.
const tried = new Map();
function tripTick() {
  if (tripStatus().running) return;
  const today = localDate();
  const trip = readJson(tripsFile, []).find((t) => {
    if (!isTrip(t) || (t.end || t.start) < today || tried.get(t.id) === today) return false;
    const generated = readJson(join(reportsDir, `${t.id}.json`), null)?.generatedAt;
    const soon = new Date(t.start) - Date.now() < 14 * DAY;
    return !generated || Date.now() - new Date(generated) > (soon ? DAY : 7 * DAY) - 60 * 60 * 1000;
  });
  if (!trip) return;
  tried.set(trip.id, today);
  console.log(`scheduled briefing for trip ${trip.id}`);
  startTrip(trip.id);
}

function loadTravelData(send) {
  const trips = readJson(tripsFile, []);
  const reports = Object.fromEntries(trips.map((t) => [t.id, readJson(join(reportsDir, `${t.id}.json`), null)]));
  send(200, { watchers: readJson(watchersFile, []), trips, reports, status: tripStatus() });
}

function saveList(file, isItem, label) {
  return (req, send) =>
    readBody(req, send, (data) => {
      if (!Array.isArray(data) || !data.every(isItem)) return send(400, { error: `bad ${label}` });
      writeAtomic(file, JSON.stringify(data, null, 2));
      send(200, { saved: true });
    });
}
const saveWatchers = saveList(watchersFile, isWatcher, 'watchers');
const saveTrips = saveList(tripsFile, isTrip, 'trips');

function runTrip(req, send) {
  readBody(req, send, (data) => {
    if (!readJson(tripsFile, []).some((t) => t.id === data.id)) return send(400, { error: 'no such trip' });
    if (tripStatus().running) return send(409, tripStatus());
    startTrip(data.id);
    send(202, tripStatus());
  });
}

// Page views and clicks from every device, for the Stats page. Counts only, keyed by page,
// section and control, with the last time each was used.
const statsFile = join(briefings, 'stats.json');
let stats = null;

function loadStats() {
  if (stats) return stats;
  try {
    stats = JSON.parse(readFileSync(statsFile, 'utf8'));
  } catch {
    stats = { since: new Date().toISOString(), views: {}, clicks: {} };
  }
  return stats;
}

function saveHit(req, send) {
  readBody(req, send, (data) => {
    const short = (value) => typeof value === 'string' && value.length > 0 && value.length <= 200;
    if (!isMap(data) || !short(data.path) || !['view', 'click'].includes(data.kind)) return send(400, { error: 'bad hit' });
    if (data.kind === 'click' && !short(data.label)) return send(400, { error: 'bad hit' });
    const all = loadStats();
    const now = new Date().toISOString();
    if (data.kind === 'view') {
      const view = (all.views[data.path] ??= { count: 0 });
      view.count += 1;
      view.last = now;
    } else {
      const section = short(data.section) ? data.section : '';
      const click = (all.clicks[[data.path, section, data.label].join('\u0000')] ??= { path: data.path, section, label: data.label, count: 0 });
      click.count += 1;
      click.last = now;
    }
    writeAtomic(statsFile, JSON.stringify(all, null, 2));
    send(200, { saved: true });
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
  if (req.url === '/api/stats' && req.method === 'GET') return send(200, loadStats());
  if (req.url === '/api/stats/hit' && req.method === 'POST') return saveHit(req, send);
  if (req.url === '/api/todos' && req.method === 'GET') return loadTodos(send);
  if (req.url === '/api/todos' && req.method === 'POST') return saveTodos(req, send);
  if (req.url === '/api/travel' && req.method === 'GET') return loadTravelData(send);
  if (req.url === '/api/travel/watchers' && req.method === 'POST') return saveWatchers(req, send);
  if (req.url === '/api/travel/trips' && req.method === 'POST') return saveTrips(req, send);
  if (req.url === '/api/travel/run' && req.method === 'POST') return runTrip(req, send);
  const [, job, action] = req.url.match(/^\/api\/(daily|briefing|records|cooking)\/(status|run)$/) ?? [];
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
setTimeout(tripTick, 90_000);
setInterval(tripTick, 15 * 60_000);
