'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { progress } from '../_daily/run-status';

type Kind = 'Movie' | 'Series';
type Service = 'Netflix' | 'Crave' | 'Prime Video' | 'Apple TV+' | 'Disney+';
type Pick = {
  title: string;
  kind: Kind;
  year: number;
  service: Service;
  released: string;
  genres: string[];
  length: string;
  rating: string;
  why: string;
  url: string;
};
// A pick can have a vote, a status, or both; the mark is dropped when it has neither
type Vote = 'up' | 'down';
type MarkStatus = 'want' | 'watched';
type Mark = Pick & { vote?: Vote; status?: MarkStatus; markedAt: string };
type Search = { stamp: string; query: string; type: 'Any' | Kind; createdAt: string; picks: Pick[] };
type Status = {
  running: boolean;
  run: { startedAt: string; finishedAt: string | null; exitCode: number | null; query: string } | null;
  estimate: number | null;
};
type Data = { profile: string; marks: Record<string, Mark>; searches: Search[]; status: Status };

const SERVICES: Service[] = ['Netflix', 'Crave', 'Prime Video', 'Apple TV+', 'Disney+'];
const TYPES = ['Any', 'Movie', 'Series'] as const;
const STATUSES: { status: MarkStatus; label: string }[] = [
  { status: 'want', label: 'Want' },
  { status: 'watched', label: 'Seen' },
];

const thumb = (down: boolean) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <g transform={down ? 'rotate(180 12 12)' : undefined}>
      <path d="M7 10v11H4V10zM7 10l4-8a3 3 0 0 1 3 3v4h5.5a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.1 21H7" />
    </g>
  </svg>
);

const keyOf = (pick: Pick) => `${pick.title} (${pick.year})`;
const day = (iso: string) =>
  new Date(iso).toLocaleString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const post = (url: string, body: unknown) =>
  fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);

function PickTable({
  picks,
  marks,
  onMark,
  onInfo,
}: {
  picks: Pick[];
  marks: Record<string, Mark>;
  onMark: (pick: Pick, change: { vote?: Vote; status?: MarkStatus }) => void;
  onInfo: (pick: Pick) => void;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table line-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Service</th>
            <th>Year</th>
            <th>Rating</th>
            <th className="col-about">About</th>
            <th>Rate</th>
            <th>Mark</th>
          </tr>
        </thead>
        <tbody>
          {picks.map((pick) => {
            const mark = marks[keyOf(pick)];
            return (
              <tr key={keyOf(pick)} data-vote={mark?.vote}>
                <td>
                  {pick.url ? (
                    <a href={pick.url} target="_blank" rel="noopener noreferrer" className="event-name clip" title={pick.title}>
                      {pick.title}
                    </a>
                  ) : (
                    <span className="event-name clip" title={pick.title}>
                      {pick.title}
                    </span>
                  )}
                </td>
                <td>{pick.kind}</td>
                <td>{pick.service}</td>
                <td className="col-date">{pick.year}</td>
                <td className="col-date">
                  <span className="clip clip-label" title={pick.rating}>
                    {pick.rating}
                  </span>
                </td>
                <td className="col-about">
                  <button type="button" className="info-button" aria-label={`About ${pick.title}`} onClick={() => onInfo(pick)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 11v5M12 8h.01" />
                    </svg>
                  </button>
                </td>
                <td className="watch-votes">
                  {(['up', 'down'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      className="info-button"
                      data-vote={v}
                      aria-pressed={mark?.vote === v}
                      aria-label={v === 'up' ? 'Thumbs up: more like this' : 'Thumbs down: less like this'}
                      title={v === 'up' ? 'More like this' : 'Less like this'}
                      onClick={() => onMark(pick, { vote: v })}
                    >
                      {thumb(v === 'down')}
                    </button>
                  ))}
                </td>
                <td className="watch-marks">
                  {STATUSES.map((m) => (
                    <button
                      key={m.status}
                      type="button"
                      className="tag"
                      aria-pressed={mark?.status === m.status}
                      onClick={() => onMark(pick, { status: m.status })}
                    >
                      {m.label}
                    </button>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Everything lives in ~/briefings/watch/ and comes through the runner, so new picks show up
// without a rebuild
export default function WatchView() {
  const [data, setData] = useState<Data | null>(null);
  const [offline, setOffline] = useState(false);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<(typeof TYPES)[number]>('Any');
  const [profile, setProfile] = useState('');
  const [profileSaved, setProfileSaved] = useState(true);
  const [service, setService] = useState<Service | null>(null);
  const [kind, setKind] = useState<Kind | null>(null);
  const [open, setOpen] = useState<Pick | null>(null);
  const [, setNow] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);

  async function load() {
    const res = await fetch('/api/watch').catch(() => null);
    if (!res?.ok) return setOffline(true);
    const next: Data = await res.json();
    setOffline(false);
    setData(next);
    setProfile((current) => (profileSaved || !current ? next.profile : current));
  }

  useEffect(() => {
    load();
  }, []);

  // Poll while a search runs, then reload to pick up the new search
  const running = data?.status.running ?? false;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(async () => {
      setNow(Date.now());
      const res = await fetch('/api/watch/status').catch(() => null);
      if (!res?.ok) return setOffline(true);
      const status: Status = await res.json();
      if (status.running) setData((d) => d && { ...d, status });
      else load();
    }, 5000);
    return () => clearInterval(id);
  }, [running]);

  async function find(e: FormEvent) {
    e.preventDefault();
    const res = await post('/api/watch/run', { query, type });
    if (!res) return setOffline(true);
    const status: Status = await res.json();
    setData((d) => d && { ...d, status });
  }

  async function saveProfile() {
    if (profileSaved) return;
    const res = await post('/api/watch/profile', { text: profile });
    if (!res?.ok) return setOffline(true);
    setProfileSaved(true);
  }

  // Clicking the active vote or status clears it
  async function mark(pick: Pick, change: { vote?: Vote; status?: MarkStatus }) {
    if (!data) return;
    const marks = { ...data.marks };
    const key = keyOf(pick);
    const current = marks[key];
    const next: Mark = { ...pick, vote: current?.vote, status: current?.status, markedAt: new Date().toISOString() };
    if (change.vote) next.vote = current?.vote === change.vote ? undefined : change.vote;
    if (change.status) next.status = current?.status === change.status ? undefined : change.status;
    if (next.vote || next.status) marks[key] = next;
    else delete marks[key];
    const res = await post('/api/watch/marks', marks);
    if (!res?.ok) return setOffline(true);
    setData({ ...data, marks });
  }

  async function remove(search: Search) {
    if (!data || !confirm(`Delete the search "${search.query || 'Anything good'}"?`)) return;
    const res = await post('/api/watch/delete', { stamp: search.stamp });
    if (!res?.ok) return setOffline(true);
    setData({ ...data, searches: data.searches.filter((s) => s !== search) });
  }

  function info(pick: Pick) {
    setOpen(pick);
    dialog.current?.showModal();
  }

  const shown = (picks: Pick[]) => picks.filter((p) => (!service || p.service === service) && (!kind || p.kind === kind));
  const allPicks = [...(data?.searches.flatMap((s) => s.picks) ?? []), ...Object.values(data?.marks ?? {})];
  const unique = [...new Map(allPicks.map((p) => [keyOf(p), p])).values()];
  const watchlist = shown(Object.values(data?.marks ?? {}).filter((m) => m.status === 'want'));
  const status = data?.status;
  const failed = status?.run && !status.running && status.run.exitCode !== 0;

  return (
    <div className="wide">
      <details className="watch-profile">
        <summary>Our tastes</summary>
        <textarea
          className="notes-input"
          rows={8}
          value={profile}
          onChange={(e) => {
            setProfile(e.target.value);
            setProfileSaved(false);
          }}
          onBlur={saveProfile}
          disabled={!data}
        />
        <div className="tab-form-actions">
          <button type="button" className="run-button" onClick={saveProfile} disabled={!data || profileSaved}>
            {profileSaved ? 'Saved' : 'Save'}
          </button>
          <span className="muted run-hint">Every search reads this, along with your marks.</span>
        </div>
      </details>

      <form className="tab-form" onSubmit={find}>
        <label>
          <span>What are you in the mood for?</span>
          <input
            type="text"
            placeholder="Something like Severance, a light comedy for a weeknight, a movie we can both agree on"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={500}
          />
        </label>
        <div className="filter-bar" role="group" aria-label="Type">
          {TYPES.map((t) => (
            <button key={t} type="button" className="tag" aria-pressed={type === t} onClick={() => setType(t)}>
              {t === 'Any' ? 'Movie or series' : t}
            </button>
          ))}
        </div>
        <div className="tab-form-actions">
          <button type="submit" className="run-button" disabled={!data || running}>
            {running ? 'Searching…' : 'Find something'}
          </button>
          {status?.running && status.run && (
            <span className="status-pill" data-state="running">
              {status.run.query ? `"${status.run.query}": ` : ''}
              {progress(status.run.startedAt, status.estimate, Date.now())}
            </span>
          )}
          {failed && (
            <span className="status-pill" data-state="failed">
              Search failed, see .runner/watch.log
            </span>
          )}
          {offline && <span className="muted run-hint">Runner is off. Start it with `make runner`.</span>}
        </div>
      </form>

      {unique.length > 0 && (
        <>
          <div className="filter-bar" role="group" aria-label="Filter by service">
            <button type="button" className="tag" aria-pressed={service === null} onClick={() => setService(null)}>
              All services
            </button>
            {SERVICES.map((s) => (
              <button key={s} type="button" className="tag" aria-pressed={service === s} onClick={() => setService(service === s ? null : s)}>
                {s} <span className="tag-count">{unique.filter((p) => p.service === s).length}</span>
              </button>
            ))}
          </div>
          <div className="filter-bar" role="group" aria-label="Filter by type">
            <button type="button" className="tag" aria-pressed={kind === null} onClick={() => setKind(null)}>
              Movies and series
            </button>
            {(['Movie', 'Series'] as const).map((k) => (
              <button key={k} type="button" className="tag" aria-pressed={kind === k} onClick={() => setKind(kind === k ? null : k)}>
                {k === 'Movie' ? 'Movies' : 'Series'} <span className="tag-count">{unique.filter((p) => p.kind === k).length}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {data === null ? (
        !offline && <p className="muted">Loading…</p>
      ) : (
        <>
          <section className="listing-section">
            <h2>Want to watch</h2>
            {watchlist.length === 0 ? (
              <p className="muted">Mark a pick as Want and it shows up here.</p>
            ) : (
              <PickTable picks={watchlist} marks={data.marks} onMark={mark} onInfo={info} />
            )}
          </section>

          {data.searches.length === 0 ? (
            <p className="muted">No searches yet.</p>
          ) : (
            data.searches.map((search) => {
              const picks = shown(search.picks);
              return (
                <section key={search.stamp} className="listing-section">
                  <h2 className="watch-search-heading">
                    <span>{search.query || 'Anything good'}</span>
                    <span className="muted watch-search-meta">
                      {search.type !== 'Any' && `${search.type} · `}
                      {day(search.createdAt)}
                    </span>
                    <button type="button" className="tag" onClick={() => remove(search)}>
                      Delete
                    </button>
                  </h2>
                  {picks.length === 0 ? (
                    <p className="muted">No picks match the filters.</p>
                  ) : (
                    <PickTable picks={picks} marks={data.marks} onMark={mark} onInfo={info} />
                  )}
                </section>
              );
            })
          )}
        </>
      )}

      {/* Clicking the backdrop (the dialog itself, outside its content) closes it */}
      <dialog ref={dialog} className="info-dialog" onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}>
        {open && (
          <div className="info-dialog-body">
            <button type="button" className="info-dialog-close" aria-label="Close" onClick={() => dialog.current?.close()}>
              ×
            </button>
            <p className="info-dialog-artist">
              {open.kind} · {open.service}
            </p>
            <h2 className="info-dialog-title">
              {open.title} ({open.year})
            </h2>
            <p className="muted">{[open.released, open.length, open.genres?.join(', '), open.rating].filter(Boolean).join(' · ')}</p>
            <p>{open.why}</p>
            {open.url && (
              <a href={open.url} target="_blank" rel="noopener noreferrer" className="event-name">
                Where to watch
              </a>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
