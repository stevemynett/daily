'use client';

import { useRef, useState } from 'react';
import type { Listing, ListingItem } from '../_daily/data';

type Release = 'New' | 'Reissue';
type Row = ListingItem;

const rows = (listing: Listing): Row[] =>
  listing.groups.flatMap((group) => group.items);

// Spotify links open the app in place; anything else opens in a new tab
const newTab = (url: string) => (url.startsWith('spotify:') ? {} : { target: '_blank', rel: 'noopener noreferrer' });

// Names are "Artist, Album"
function splitName(name: string) {
  const i = name.indexOf(', ');
  return i === -1 ? { artist: '', album: name } : { artist: name.slice(0, i), album: name.slice(i + 2) };
}

function AlbumTable({ items }: { items: Row[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<Row | null>(null);
  const show = (item: Row) => {
    setOpen(item);
    dialog.current?.showModal();
  };
  const current = open && splitName(open.name);

  return (
    <div className="table-wrap">
      <table className="data-table line-table">
        <thead>
          <tr>
            <th>Artist</th>
            <th>Album</th>
            <th>Label</th>
            <th className="col-about">About</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const { artist, album } = splitName(item.name);
            return (
              <tr key={i}>
                <td className="col-band">
                  <span className="clip" title={artist}>
                    {artist}
                  </span>
                </td>
                <td>
                  {item.url ? (
                    <a href={item.url} {...newTab(item.url)} className="event-name clip" title={album}>
                      {album}
                    </a>
                  ) : (
                    <span className="event-name clip" title={album}>
                      {album}
                    </span>
                  )}
                </td>
                <td>
                  <span className="clip clip-label" title={item.where}>
                    {item.where}
                  </span>
                </td>
                <td className="col-about">
                  {item.description && (
                    <button type="button" className="info-button" aria-label={`About ${album}`} onClick={() => show(item)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 11v5M12 8h.01" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Clicking the backdrop (the dialog itself, outside its content) closes it */}
      <dialog ref={dialog} className="info-dialog" onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}>
        {open && current && (
          <div className="info-dialog-body">
            <button type="button" className="info-dialog-close" aria-label="Close" onClick={() => dialog.current?.close()}>
              ×
            </button>
            <p className="info-dialog-artist">{current.artist}</p>
            <h2 className="info-dialog-title">{current.album}</h2>
            <p className="muted">
              {[open.where, open.category].filter(Boolean).join(' · ')}
            </p>
            <p>{open.description}</p>
            {open.url && (
              <a href={open.url} {...newTab(open.url)} className="event-name">
                Open in Spotify
              </a>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}

// Release type and genre filters
export default function AlbumsView({ released }: { released: Listing }) {
  const [release, setRelease] = useState<Release | null>(null);
  const [genre, setGenre] = useState<string | null>(null);
  const everything = rows(released);

  const byRelease = (r: Release | null) => (item: Row) => !r || item.release === r;
  const byGenre = (g: string | null) => (item: Row) => !g || item.category === g;
  const shown = (items: Row[]) => items.filter(byRelease(release)).filter(byGenre(genre));

  const genres = new Map<string, number>();
  for (const item of everything.filter(byRelease(release))) {
    if (item.category) genres.set(item.category, (genres.get(item.category) ?? 0) + 1);
  }
  const releasedRows = shown(everything);

  return (
    <div className="wide">
      <div className="filter-bar" role="group" aria-label="Filter by release type">
        {([null, 'New', 'Reissue'] as const).map((r) => (
          <button key={r ?? 'all'} type="button" className="tag" aria-pressed={release === r} onClick={() => setRelease(r)}>
            {r === null ? 'All' : r === 'New' ? 'New records' : 'Reissues'}{' '}
            <span className="tag-count">{everything.filter(byGenre(genre)).filter(byRelease(r)).length}</span>
          </button>
        ))}
      </div>

      <div className="filter-bar" role="group" aria-label="Filter by genre">
        <button type="button" className="tag" aria-pressed={genre === null} onClick={() => setGenre(null)}>
          All genres <span className="tag-count">{everything.filter(byRelease(release)).length}</span>
        </button>
        {[...genres].map(([g, count]) => (
          <button key={g} type="button" className="tag" aria-pressed={genre === g} onClick={() => setGenre(genre === g ? null : g)}>
            {g} <span className="tag-count">{count}</span>
          </button>
        ))}
      </div>

      <section className="listing-section">
        {releasedRows.length === 0 ? <p className="muted">No albums listed.</p> : <AlbumTable items={releasedRows} />}
        {released.footer && <p className="caption">{released.footer}</p>}
      </section>
    </div>
  );
}
