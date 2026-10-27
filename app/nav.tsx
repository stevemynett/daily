'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const links = [
  {
    href: '/',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    href: '/todo',
    label: 'Todo',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="m8 12 3 3 5-6" />
      </svg>
    ),
  },
  {
    href: '/jobs',
    label: 'Jobs',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
      </svg>
    ),
  },
  {
    href: '/events',
    label: 'Events',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    href: '/briefing',
    label: 'News',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 4h13v15a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2zM17 8h3v11a2 2 0 0 1-2 2" />
        <path d="M8 8h5M8 12h5M8 16h3" />
      </svg>
    ),
  },
  {
    href: '/food',
    label: 'Food',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 21V3c-2.5 1.5-4 4.5-4 8h4" />
      </svg>
    ),
  },
  {
    href: '/cooking',
    label: 'Cooking',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 11h18M5 11v7a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-7M21 11h1M2 11h1M9 3c0 1.5 1 1.5 1 3s-1 1.5-1 3M14 3c0 1.5 1 1.5 1 3s-1 1.5-1 3" />
      </svg>
    ),
  },
  {
    href: '/travel',
    label: 'Travel',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </svg>
    ),
  },
  {
    href: '/shopping',
    label: 'Shopping',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 8h14l-1 12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z" />
        <path d="M9 10V6a3 3 0 0 1 6 0v4" />
      </svg>
    ),
  },
  {
    href: '/albums',
    label: 'Records',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    ),
  },
  {
    href: '/tabs',
    label: 'To Read',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 5h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H3zM21 5h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z" />
      </svg>
    ),
  },
  {
    href: '/saved',
    label: 'Saved',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
      </svg>
    ),
  },
  {
    href: '/photography',
    label: 'Photography',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
    children: [
      { href: '/photography/editing-jazz', label: 'Editing Jazz' },
      { href: '/photography/editing-personal', label: 'Editing Personal' },
      { href: '/photography/archive', label: 'Archive' },
    ],
  },
];

// Every page the sidebar links to, for the Stats page
export const pages = links.flatMap((link) => [{ href: link.href, label: link.label }, ...(link.children ?? [])]);

const menuIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const closeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export default function Nav({ siteName }: { siteName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="mobile-header">
        <button
          type="button"
          className="icon-button"
          aria-label="Open navigation"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen(true)}
        >
          {menuIcon}
        </button>
        <Link className="site-name" href="/">
          {siteName}
        </Link>
      </header>
      <nav id="site-nav" aria-label="Main" className="nav" data-open={open}>
        <div className="nav-head">
          <Link className="site-name" href="/" onClick={() => setOpen(false)}>
            {siteName}
          </Link>
          <button type="button" className="icon-button" aria-label="Close navigation" onClick={() => setOpen(false)}>
            {closeIcon}
          </button>
        </div>
        <div className="nav-links">
          {links.map((link) => (
            <div key={link.href}>
              <Link
                href={link.href}
                className="nav-link"
                aria-current={pathname === link.href ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
              {link.children && (
                <div className="nav-sublinks">
                  {link.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="nav-link nav-sublink"
                      aria-current={pathname === child.href ? 'page' : undefined}
                      onClick={() => setOpen(false)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <Link href="/stats" className="nav-stats" aria-current={pathname === '/stats' ? 'page' : undefined} onClick={() => setOpen(false)}>
          Stats
        </Link>
      </nav>
    </>
  );
}
