'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Counts page views and clicks for the Stats page. Fire and forget: if the runner is off, nothing is counted.
const hit = (body: { kind: 'view' | 'click'; path: string; section?: string; label?: string }) =>
  navigator.sendBeacon?.('/api/stats/hit', JSON.stringify(body));

const clean = (text: string) => text.replace(/\s+/g, ' ').trim().replace(/\s*\d+$/, '').slice(0, 120);

// A click is named by its control and grouped under the section it's in: the sidebar, or the
// nearest section heading on the page
function describe(el: Element) {
  const label = clean(el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '');
  const heading = el.closest('nav')
    ? 'Sidebar'
    : el.closest('dialog')
      ? 'Details'
      : el.closest('section')?.querySelector('h2')?.textContent;
  return { label, section: heading ? clean(heading) : undefined };
}

export default function StatsTracker() {
  const pathname = usePathname();
  const path = pathname.replace(/(.)\/$/, '$1');

  // Looking at the stats isn't counted
  const counted = path !== '/stats';

  useEffect(() => {
    if (counted) hit({ kind: 'view', path });
  }, [path, counted]);

  useEffect(() => {
    if (!counted) return;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element).closest('a, button, summary, [role="tab"]');
      if (!el) return;
      const { label, section } = describe(el);
      if (label) hit({ kind: 'click', path, section, label });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [path, counted]);

  return null;
}
