'use client';

import { useEffect, useState } from 'react';
import { pages } from '../nav';

type Use = { count: number; last: string };
type Click = Use & { path: string; section: string; label: string };
type Stats = { since: string; views: Record<string, Use>; clicks: Record<string, Click> };

const day = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });

function ago(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
}

const nameOf = (path: string) => pages.find((p) => p.href === path)?.label ?? path;

// Read from ~/briefings/stats.json through the runner. Pages in the sidebar show even with no
// views, so the ones that never get opened stand out.
export default function StatsView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setStats)
      .catch(() => setOffline(true));
  }, []);

  if (offline) return <p className="muted">Runner is off. Start it with `make runner`.</p>;
  if (!stats) return <p className="muted">Loading…</p>;

  const paths = new Set([...pages.map((p) => p.href), ...Object.keys(stats.views)]);
  const views = [...paths]
    .map((path) => ({ path, ...(stats.views[path] ?? { count: 0, last: '' }) }))
    .sort((a, b) => b.count - a.count || nameOf(a.path).localeCompare(nameOf(b.path)));
  const clicks = Object.values(stats.clicks);
  const byPage = [...new Set(clicks.map((c) => c.path))]
    .map((path) => ({
      path,
      total: clicks.filter((c) => c.path === path).reduce((n, c) => n + c.count, 0),
      rows: clicks.filter((c) => c.path === path).sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <>
      <p className="muted">Counting since {day(stats.since)}, on every device that opens the site.</p>

      <section className="listing-section">
        <h2>Page views</h2>
        <div className="table-wrap">
          <table className="data-table stats-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Views</th>
                <th>Last viewed</th>
              </tr>
            </thead>
            <tbody>
              {views.map((v) => (
                <tr key={v.path} data-unused={v.count === 0 || undefined}>
                  <td>{nameOf(v.path)}</td>
                  <td className="stats-count">{v.count}</td>
                  <td>{v.last ? ago(v.last) : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="listing-section">
        <h2>Clicks</h2>
        {byPage.length === 0 && <p className="muted">No clicks yet.</p>}
        {byPage.map((page) => (
          <div key={page.path} className="day">
            <h3>
              {nameOf(page.path)} <span className="muted">{page.total}</span>
            </h3>
            <div className="table-wrap">
              <table className="data-table stats-table">
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Button or link</th>
                    <th>Clicks</th>
                    <th>Last clicked</th>
                  </tr>
                </thead>
                <tbody>
                  {page.rows.map((c) => (
                    <tr key={`${c.section}${c.label}`}>
                      <td>{c.section || '–'}</td>
                      <td>{c.label}</td>
                      <td className="stats-count">{c.count}</td>
                      <td>{ago(c.last)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
