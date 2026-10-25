'use client';

import { useEffect, useState } from 'react';

type Status = {
  running: boolean;
  busy: boolean;
  lastRun: string | null;
  run: { startedAt: string; exitCode: number | null } | null;
  estimate: number | null;
};

const format = (iso: string) =>
  new Date(iso).toLocaleString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Vancouver',
  });

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Vancouver' });
const minutes = (ms: number) => {
  const m = Math.max(1, Math.round(ms / 60_000));
  return m === 1 ? '1 min' : `${m} min`;
};

// Time left from the median of past runs; none until a run has finished under the runner
export function progress(startedAt: string, estimate: number | null, now: number) {
  const elapsed = now - new Date(startedAt).getTime();
  const started = `Started ${time(startedAt)}`;
  if (!estimate) return `${started}, ${minutes(elapsed)} so far. No estimate until a run finishes.`;
  if (elapsed > estimate) return `${started}, ${minutes(elapsed)} so far, longer than the usual ${minutes(estimate)}`;
  const done = new Date(new Date(startedAt).getTime() + estimate).toISOString();
  return `${started}, about ${minutes(estimate - elapsed)} left (done around ${time(done)})`;
}

// lastRun is the listing's mtime at build; the runner (make runner) reports live status.
// Only one job runs at a time, so busy means this one or another is running.
export default function RunStatus({ job = 'daily', lastRun }: { job?: 'daily' | 'briefing' | 'records'; lastRun: string | null }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [offline, setOffline] = useState(false);

  async function refresh() {
    try {
      const res = await fetch(`/api/${job}/status`);
      if (!res.ok) throw new Error();
      const next: Status = await res.json();
      setStatus(next);
      setOffline(false);
      return next;
    } catch {
      setOffline(true);
      return null;
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!status?.busy) return;
    const wasRunning = status.running;
    const id = setInterval(async () => {
      const next = await refresh();
      if (wasRunning && next && !next.running && next.run?.exitCode === 0) location.reload();
    }, 5000);
    return () => clearInterval(id);
  }, [status?.busy, status?.running]);

  async function trigger() {
    const res = await fetch(`/api/${job}/run`, { method: 'POST' }).catch(() => null);
    if (!res) return setOffline(true);
    setStatus(await res.json());
  }

  const failed = status && !status.running && status.run && status.run.exitCode !== 0;

  return (
    <div className="run-status">
      <span className="status-pill" data-state={status?.running ? 'running' : failed ? 'failed' : 'idle'}>
        {status?.running
          ? progress(status.run.startedAt, status.estimate ?? null, Date.now())
          : failed
            ? `Last run failed, see .runner/${job}.log`
            : status?.busy
              ? 'Waiting for another run'
            : lastRun
              ? `Last run ${format(lastRun)}`
              : 'Never run'}
      </span>
      <button
        type="button"
        className="run-button"
        onClick={trigger}
        disabled={offline || status?.busy}
        title={offline ? 'Start the runner with `make runner`' : undefined}
      >
        {status?.running ? 'Running…' : 'Run now'}
      </button>
      {offline && <span className="muted run-hint">Runner is off. Start it with `make runner`.</span>}
    </div>
  );
}
