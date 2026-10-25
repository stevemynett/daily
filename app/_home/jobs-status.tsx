'use client';

import { useEffect, useState } from 'react';

type Status = {
  running: boolean;
  run: { startedAt: string; finishedAt: string | null; exitCode: number | null } | null;
  estimate: number | null;
};

const JOBS = [
  { id: 'daily', label: 'Daily listings' },
  { id: 'briefing', label: 'Briefing' },
] as const;

const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, '0');
  return `${h ? `${h}:` : ''}${mm}:${String(s % 60).padStart(2, '0')}`;
};

// Live view of the runner's jobs: polls every 10 seconds while one runs, every 30 when idle
export default function JobsStatus() {
  const [statuses, setStatuses] = useState<Record<string, Status> | null>(null);
  const [offline, setOffline] = useState(false);
  const [now, setNow] = useState(Date.now());

  const anyRunning = !!statuses && Object.values(statuses).some((s) => s.running);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      Promise.all(JOBS.map((j) => fetch(`/api/${j.id}/status`).then((res) => (res.ok ? res.json() : Promise.reject()))))
        .then((list: Status[]) => {
          if (cancelled) return;
          setStatuses(Object.fromEntries(JOBS.map((j, i) => [j.id, list[i]])));
          setOffline(false);
        })
        .catch(() => !cancelled && setOffline(true));
    load();
    const id = setInterval(load, anyRunning ? 10_000 : 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [anyRunning]);

  useEffect(() => {
    if (!anyRunning) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [anyRunning]);

  if (offline) {
    return (
      <div className="jobs-status" data-state="offline" title="Start it with `make runner`">
        <span className="jobs-dot" />
        Runner off
      </div>
    );
  }
  if (!statuses) return null;

  const running = JOBS.filter((j) => statuses[j.id].running);
  const failed = JOBS.filter((j) => {
    const s = statuses[j.id];
    return !s.running && s.run && typeof s.run.exitCode === 'number' && s.run.exitCode !== 0;
  });

  if (running.length === 0) {
    return (
      <div className="jobs-status" data-state={failed.length ? 'failed' : 'idle'}>
        <span className="jobs-dot" />
        {failed.length ? `${failed.map((j) => j.label).join(' and ')} failed` : 'No jobs running'}
      </div>
    );
  }

  return (
    <div className="jobs-status" data-state="running">
      {running.map((j) => {
        const { run, estimate } = statuses[j.id];
        const elapsed = now - new Date(run!.startedAt).getTime();
        const share = estimate ? Math.min(elapsed / estimate, 1) : null;
        const left = estimate ? estimate - elapsed : null;
        return (
          <div key={j.id} className="jobs-row">
            <span className="jobs-dot" />
            <span className="jobs-name">{j.label}</span>
            <span className="jobs-clock">{clock(elapsed)}</span>
            <span className="jobs-left">
              {left === null ? 'no estimate yet' : left > 0 ? `~${Math.ceil(left / 60_000)} min left` : 'running long'}
            </span>
            {share !== null && (
              <span className="jobs-bar" data-over={left! <= 0 || undefined}>
                <span style={{ width: `${share * 100}%` }} />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
