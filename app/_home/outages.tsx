'use client';

import { useEffect, useState } from 'react';

type Outage = { service: string; title: string; level: 'Down' | 'Degraded' | 'Recovering'; since: string | null; url: string };
type Outages = { updatedAt: string; checked: string[]; failed: string[]; items: Outage[] };

const time = (date: Date) => date.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' }).replace(/\.$/, '');

function started(since: string | null) {
  if (!since) return '';
  const date = new Date(since);
  const hours = (Date.now() - date.getTime()) / 3_600_000;
  if (hours < 1) return `started ${Math.max(1, Math.round(hours * 60))} min ago`;
  if (hours < 24) return `started ${Math.round(hours)}h ago`;
  return `since ${date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}`;
}

// Polls the runner every 2 minutes; it checks official status pages and
// returns only services with an open incident
export default function Outages() {
  const [data, setData] = useState<Outages | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/outages');
        if (!res.ok) throw new Error();
        setData(await res.json());
        setFailed(false);
      } catch {
        setFailed(true);
      }
    }
    load();
    const id = setInterval(load, 2 * 60_000);
    return () => clearInterval(id);
  }, []);

  if (failed && !data) return <p className="muted">Outage checks aren't available. The runner may be off (`make install-runner`).</p>;
  if (!data) return <p className="muted">Checking status pages…</p>;

  return (
    <>
      {data.items.length === 0 ? (
        <p className="outage-clear">Nothing is down right now.</p>
      ) : (
        <ul className="event-list">
          {data.items.map((item) => (
            <li key={`${item.service}-${item.url}-${item.title}`}>
              <span>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="event-name">
                  {item.service}
                </a>
                <span className="tag outage-level" data-level={item.level}>
                  {item.level}
                </span>
              </span>
              <span>{item.title}</span>
              {item.since && <span className="event-when">{started(item.since)}</span>}
            </li>
          ))}
        </ul>
      )}
      <details className="market-meta muted">
        <summary>
          Official status pages for {data.checked.length} services, checked {time(new Date(data.updatedAt))}.
          {data.failed.length > 0 && ` Couldn't reach ${data.failed.join(', ')}.`}
        </summary>
        {data.checked.join(', ')}.
      </details>
    </>
  );
}
