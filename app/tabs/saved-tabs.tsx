'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

type List = 'read' | 'saved';
type Tab = { url: string; why: string; added: string; list: List };

const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const day = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

// Matched in order against the hostname, or the whole URL for kinds marked byUrl; the last is the fallback
const KINDS: { kind: string; match: RegExp; byUrl?: boolean; icon: ReactNode }[] = [
  {
    kind: 'Video',
    match: /(^|\.)(youtube\.com|youtu\.be|vimeo\.com|twitch\.tv|tiktok\.com|nebula\.tv|dailymotion\.com)$/,
    icon: svg(
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m10 9 5 3-5 3z" />
      </>,
    ),
  },
  {
    kind: 'Code',
    match: /(^|\.)(github\.com|gitlab\.com|codeberg\.org|bitbucket\.org|sr\.ht|npmjs\.com|pypi\.org|crates\.io|codepen\.io|observablehq\.com)$/,
    icon: svg(<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />),
  },
  {
    kind: 'Paper',
    match: /(\.pdf($|[?#]))|(\/\/(www\.)?(arxiv\.org|doi\.org|ssrn\.com|biorxiv\.org|semanticscholar\.org|acm\.org|dl\.acm\.org)\/)/,
    byUrl: true,
    icon: svg(
      <>
        <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
      </>,
    ),
  },
  {
    kind: 'Audio',
    match: /(^|\.)(spotify\.com|soundcloud\.com|bandcamp\.com|podcasts\.apple\.com|music\.apple\.com|overcast\.fm|pca\.st)$/,
    icon: svg(
      <>
        <path d="M9 18V5l11-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="17" cy="16" r="3" />
      </>,
    ),
  },
  {
    kind: 'Discussion',
    match: /(^|\.)(reddit\.com|news\.ycombinator\.com|lobste\.rs|stackoverflow\.com|stackexchange\.com|discourse\.org)$/,
    icon: svg(<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />),
  },
  {
    kind: 'Social',
    match: /(^|\.)(x\.com|twitter\.com|bsky\.app|threads\.net|mastodon\.social|instagram\.com|linkedin\.com|facebook\.com)$/,
    icon: svg(
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3 20a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3 6" />
      </>,
    ),
  },
  {
    kind: 'Image',
    match: /(\.(png|jpe?g|gif|webp|heic)($|[?#]))|(\/\/(www\.)?(flickr\.com|500px\.com|unsplash\.com|imgur\.com)\/)/,
    byUrl: true,
    icon: svg(
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="m21 16-5-5-9 9" />
      </>,
    ),
  },
  {
    kind: 'Shop',
    match: /(^|\.)(amazon\.(com|ca)|etsy\.com|ebay\.(com|ca)|bhphotovideo\.com|kickstarter\.com)$/,
    icon: svg(
      <>
        <path d="M5 7h14l-1 13H6z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </>,
    ),
  },
  {
    kind: 'Article',
    match: /./,
    icon: svg(
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>,
    ),
  },
];

const kindOf = (url: string) => KINDS.find((k) => k.match.test(k.byUrl ? url : host(url)))!;

// Both lists live in ~/briefings/saved-tabs.json, read and written through the runner;
// each page shows one and leaves the other's entries alone
export default function SavedTabs({ list }: { list: List }) {
  const [tabs, setTabs] = useState<Tab[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [kind, setKind] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [why, setWhy] = useState('');

  useEffect(() => {
    // Old links to the Saved list on this page
    if (list === 'read' && location.hash === '#saved') location.replace('/saved');
    fetch('/api/tabs')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setTabs)
      .catch(() => setOffline(true));
  }, [list]);

  async function save(next: Tab[]) {
    const res = await fetch('/api/tabs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(next),
    }).catch(() => null);
    if (!res?.ok) return setOffline(true);
    setOffline(false);
    setTabs(next);
    return true;
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!tabs || !url.trim()) return;
    const link = /^https?:\/\//.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    const rest = tabs.filter((t) => !(t.url === link && t.list === list));
    const tab: Tab = { url: link, why: list === 'saved' ? why.trim() : '', added: new Date().toISOString(), list };
    if (await save([tab, ...rest])) {
      setUrl('');
      setWhy('');
    }
  }

  const remove = (tab: Tab) => save(tabs!.filter((t) => t !== tab));
  const inList = (id: List) => (tabs ?? []).filter((t) => t.list === id);
  const shown = inList(list).filter((t) => !kind || kindOf(t.url).kind === kind);
  const kinds = KINDS.map((k) => ({ ...k, count: inList('saved').filter((t) => kindOf(t.url).kind === k.kind).length })).filter((k) => k.count);

  return (
    <>
      <form
        className="tab-form"
        onSubmit={add}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            e.currentTarget.requestSubmit();
          }
        }}
      >
        <label>
          <span>Link</span>
          <input type="text" inputMode="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} required />
        </label>
        {list === 'saved' && (
          <label>
            <span>Why</span>
            <textarea rows={2} placeholder="Why it's worth keeping" value={why} onChange={(e) => setWhy(e.target.value)} />
          </label>
        )}
        <div className="tab-form-actions">
          <button type="submit" className="run-button" disabled={!tabs}>
            {list === 'saved' ? 'Save' : 'Add to read later'}
          </button>
          {offline && <span className="muted run-hint">Runner is off. Start it with `make runner`.</span>}
        </div>
      </form>

      {list === 'saved' && kinds.length > 1 && (
        <div className="filter-bar">
          {kinds.map((k) => (
            <button
              key={k.kind}
              type="button"
              className="tag tab-filter"
              aria-pressed={kind === k.kind}
              onClick={() => setKind(kind === k.kind ? null : k.kind)}
            >
              {k.icon}
              {k.kind}
              <span className="tag-count">{k.count}</span>
            </button>
          ))}
        </div>
      )}

      {tabs === null ? (
        !offline && <p className="muted">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="muted">{list === 'saved' ? 'Nothing saved yet.' : 'Nothing waiting to be read.'}</p>
      ) : (
        <ul className="tab-list">
          {shown.map((tab) => {
            const k = kindOf(tab.url);
            return (
              <li key={`${tab.list}${tab.url}`} className="tab-item">
                {list === 'saved' && (
                  <span className="tab-kind" data-kind={k.kind} title={k.kind}>
                    {k.icon}
                  </span>
                )}
                <div className="tab-body">
                  <div>
                    <a href={tab.url} target="_blank" rel="noreferrer" className="tab-link">
                      {host(tab.url)}
                    </a>
                    {list === 'saved' && <span className="tab-kind-label">{k.kind}</span>}
                    <span className="muted tab-date">{day(tab.added)}</span>
                  </div>
                  {tab.why && <p>{tab.why}</p>}
                  <p className="muted tab-url">{tab.url}</p>
                </div>
                <button type="button" className="tag tab-remove" onClick={() => remove(tab)}>
                  {list === 'saved' ? 'Delete' : 'Done'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
