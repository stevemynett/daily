// Local helper so the static site can trigger `make daily` and `make briefing`, save
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
};

function lastRun(job) {
  try {
    return statSync(jobs[job].output()).mtime.toISOString();
  } catch {
    return null;
  }
}

function start(job) {
  const run = { startedAt: new Date().toISOString(), finishedAt: null, exitCode: null };
  jobs[job].run = run;
  const log = createWriteStream(join(logDir, `${job}.log`));
  const child = spawn('make', [job], { cwd: root, env: process.env });
  child.stdout.pipe(log);
  child.stderr.pipe(log);
  child.on('close', (code) => {
    run.finishedAt = new Date().toISOString();
    run.exitCode = code;
    console.log(`make ${job} exited with ${code}`);
    tick();
  });
}

const running = (job) => !!jobs[job].run && jobs[job].run.finishedAt === null;
// Both jobs end in `next build`, so only one runs at a time
const busy = () => Object.keys(jobs).some(running);
const status = (job) => ({ running: running(job), busy: busy(), lastRun: lastRun(job), run: jobs[job].run });

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
  const job = ['briefing', 'daily'].find(due);
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
  if (req.url === '/api/jobs/saved' && req.method === 'GET') return loadTracked(send);
  if (req.url === '/api/jobs/saved' && req.method === 'POST') return saveTracked(req, send);
  const [, job, action] = req.url.match(/^\/api\/(daily|briefing)\/(status|run)$/) ?? [];
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
