'use client';

import { useEffect, useState } from 'react';

type Status = { running: boolean; busy: boolean; lastRun: string | null; run: { startedAt: string; exitCode: number | null } | null };

const format = (iso: string) =>
  new Date(iso).toLocaleString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Vancouver',
  });

// lastRun is the listing's mtime at build; the runner (make runner) reports live status.
// Only one job runs at a time, so busy means this one or another is running.
export default function RunStatus({ job = 'daily', lastRun }: { job?: 'daily' | 'briefing'; lastRun: string | null }) {
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
          ? `Running since ${format(status.run.startedAt)}`
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
