'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { Trip as Deal } from '../_home/travel';
import { progress } from '../_daily/run-status';

type Watcher = { terms: string; maxPrice?: number; added: string };
type Trip = { id: string; place: string; start: string; end?: string; notes?: string; added: string };
type Item = { title: string; date?: string; where?: string; why?: string; url?: string };
type Report = { id: string; generatedAt: string; summary: string; sections: { name: string; items: Item[] }[] };
type Status = {
  running: boolean;
  run: { id: string; startedAt: string; finishedAt: string | null; exitCode: number | null } | null;
  estimate: number | null;
};
type Data = { watchers: Watcher[]; trips: Trip[]; reports: Record<string, Report | null>; status: Status };

const post = (url: string, body: unknown) =>
  fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);

const slug = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

const fmtDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const fmtStamp = (iso: string) =>
  new Date(iso).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const daysUntil = (date: string) => Math.ceil((new Date(`${date}T00:00:00`).getTime() - Date.now()) / 86_400_000);

// "Lisbon, Portugal" matches a deal whose title or details mention either word
const termsOf = (watcher: Watcher) =>
  watcher.terms
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
const lowest = (deal: Deal) => Number(deal.price?.match(/\$([\d,]+)/)?.[1].replace(/,/g, '')) || null;
const matches = (watcher: Watcher, deal: Deal) => {
  const text = `${deal.title} ${deal.details.join(' ')}`.toLowerCase();
  if (!termsOf(watcher).some((t) => text.includes(t))) return false;
  const price = lowest(deal);
  return !watcher.maxPrice || price === null || price <= watcher.maxPrice;
};

function DealList({ deals }: { deals: Deal[] }) {
  return (
    <ul className="event-list">
      {deals.map((deal) => (
        <li key={`${deal.source} ${deal.title} ${deal.url}`}>
          <span>
            <a href={deal.url} target="_blank" rel="noopener noreferrer" className="event-name">
              {deal.title}
            </a>
            {deal.price && <span> · {deal.price}</span>}
          </span>
          <span className="event-when">{[deal.source, ...deal.details].join(' · ')}</span>
        </li>
      ))}
    </ul>
  );
}

export default function TravelView({ deals, builtAt }: { deals: Deal[] | null; builtAt: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [offline, setOffline] = useState(false);
  const [terms, setTerms] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [place, setPlace] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [notes, setNotes] = useState('');
  // The trip the form is editing, or null when it adds a new one
  const [editing, setEditing] = useState<Trip | null>(null);
  const [, setNow] = useState(0);

  async function load() {
    const res = await fetch('/api/travel').catch(() => null);
    if (!res?.ok) return setOffline(true);
    setOffline(false);
    setData(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  // Poll while a trip briefing runs, then reload to pick it up
  const running = data?.status.running ?? false;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(async () => {
      setNow(Date.now());
      const res = await fetch('/api/travel').catch(() => null);
      if (!res?.ok) return setOffline(true);
      setData(await res.json());
    }, 5000);
    return () => clearInterval(id);
  }, [running]);

  async function saveWatchers(watchers: Watcher[]) {
    const res = await post('/api/travel/watchers', watchers);
    if (!res?.ok) return setOffline(true);
    setData((d) => d && { ...d, watchers });
    return true;
  }

  async function saveTrips(trips: Trip[]) {
    const res = await post('/api/travel/trips', trips);
    if (!res?.ok) return setOffline(true);
    setData((d) => d && { ...d, trips });
    return true;
  }

  async function refresh(id: string) {
    const res = await post('/api/travel/run', { id });
    if (!res) return setOffline(true);
    const status: Status = await res.json();
    if (res.ok) setData((d) => d && { ...d, status });
  }

  async function addWatcher(e: FormEvent) {
    e.preventDefault();
    if (!data || !terms.trim()) return;
    const watcher: Watcher = { terms: terms.trim(), added: new Date().toISOString() };
    if (Number(maxPrice) > 0) watcher.maxPrice = Number(maxPrice);
    if (await saveWatchers([...data.watchers, watcher])) {
      setTerms('');
      setMaxPrice('');
    }
  }

  function fillForm(trip: Trip | null) {
    setEditing(trip);
    setPlace(trip?.place ?? '');
    setStart(trip?.start ?? '');
    setEnd(trip?.end ?? '');
    setNotes(trip?.notes ?? '');
    if (trip) document.getElementById('trip-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // An edited trip keeps its id so its briefing stays attached; the briefing reruns if anything changed
  async function addTrip(e: FormEvent) {
    e.preventDefault();
    if (!data || !place.trim() || !start) return;
    const trip: Trip = {
      id: editing?.id ?? `${slug(place)}-${start}`,
      place: place.trim(),
      start,
      end: end || undefined,
      notes: notes.trim() || undefined,
      added: editing?.added ?? new Date().toISOString(),
    };
    const changed =
      !editing ||
      editing.place !== trip.place ||
      editing.start !== trip.start ||
      (editing.end ?? '') !== (trip.end ?? '') ||
      (editing.notes ?? '') !== (trip.notes ?? '');
    const rest = data.trips.filter((t) => t.id !== trip.id);
    if (await saveTrips([...rest, trip].sort((a, b) => a.start.localeCompare(b.start)))) {
      fillForm(null);
      if (changed && !data.status.running) refresh(trip.id);
    }
  }

  function removeTrip(trip: Trip) {
    if (data && confirm(`Remove the ${trip.place} trip?`)) saveTrips(data.trips.filter((t) => t !== trip));
  }

  const status = data?.status;
  const today = new Date().toLocaleDateString('en-CA');
  const upcoming = (data?.trips ?? []).filter((t) => (t.end || t.start) >= today);

  return (
    <div className="wide">
      {offline && <p className="muted run-hint">Runner is off. Start it with `make runner`.</p>}

      <section className="listing-section">
        <h2>Upcoming trips</h2>
        <form id="trip-form" className="tab-form travel-form" onSubmit={addTrip}>
          <label>
            <span>Where</span>
            <input type="text" placeholder="Lisbon, Portugal" value={place} onChange={(e) => setPlace(e.target.value)} required />
          </label>
          <label>
            <span>From</span>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
          </label>
          <label>
            <span>To</span>
            <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
          </label>
          <label className="travel-notes">
            <span>Notes</span>
            <input type="text" placeholder="Staying in Alfama, love seafood and fado" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <div className="tab-form-actions">
            <button type="submit" className="run-button" disabled={!data}>
              {editing ? 'Save trip' : 'Add trip'}
            </button>
            {editing && (
              <button type="button" className="tag" onClick={() => fillForm(null)}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {data && upcoming.length === 0 && <p className="muted">No upcoming trips.</p>}
        {upcoming.map((trip) => {
          const report = data?.reports[trip.id];
          const mine = status?.run?.id === trip.id;
          const failed = mine && status?.run && !status.running && status.run.exitCode !== 0;
          const until = daysUntil(trip.start);
          return (
            <article key={trip.id} className="trip">
              <div className="trip-head">
                <h3>{trip.place}</h3>
                <span className="muted">
                  {fmtDate(trip.start)}
                  {trip.end && trip.end !== trip.start && ` to ${fmtDate(trip.end)}`}
                  {until > 0 ? ` · in ${until} day${until === 1 ? '' : 's'}` : ' · now'}
                </span>
                <span className="trip-actions">
                  <button type="button" className="tag" onClick={() => refresh(trip.id)} disabled={status?.running}>
                    Refresh
                  </button>
                  <button type="button" className="tag" onClick={() => fillForm(trip)}>
                    Edit
                  </button>
                  <button type="button" className="tag" onClick={() => removeTrip(trip)}>
                    Remove
                  </button>
                </span>
              </div>
              {trip.notes && <p className="muted">{trip.notes}</p>}
              {mine && status?.running && status.run && (
                <span className="status-pill" data-state="running">
                  {progress(status.run.startedAt, status.estimate, Date.now())}
                </span>
              )}
              {failed && (
                <span className="status-pill" data-state="failed">
                  Briefing failed, see .runner/trip.log
                </span>
              )}
              {!report ? (
                !(mine && status?.running) && <p className="muted">No briefing yet.</p>
              ) : (
                <>
                  <p className="trip-summary">{report.summary}</p>
                  {report.sections.map((section) => (
                    <div key={section.name} className="day">
                      <h3>
                        {section.name} <span className="type-count">{section.items.length}</span>
                      </h3>
                      {section.items.length === 0 ? (
                        <p className="muted">Nothing notable.</p>
                      ) : (
                        <ul className="event-list">
                          {section.items.map((item, i) => (
                            <li key={i}>
                              <span>
                                {item.url ? (
                                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="event-name">
                                    {item.title}
                                  </a>
                                ) : (
                                  <span className="event-name">{item.title}</span>
                                )}
                              </span>
                              {(item.date || item.where) && (
                                <span className="event-when">{[item.date, item.where].filter(Boolean).join(' · ')}</span>
                              )}
                              {item.why && <span>{item.why}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                  <p className="muted trip-updated">
                    Updated {fmtStamp(report.generatedAt)}. Refreshes weekly, and daily in the two weeks before the trip.
                  </p>
                </>
              )}
            </article>
          );
        })}
      </section>

      <section className="listing-section">
        <h2>Deal watchers</h2>
        <form className="tab-form travel-form" onSubmit={addWatcher}>
          <label>
            <span>Places</span>
            <input type="text" placeholder="Japan, Tokyo, Osaka" value={terms} onChange={(e) => setTerms(e.target.value)} required />
          </label>
          <label>
            <span>Max price</span>
            <input type="number" min="0" step="50" placeholder="Any" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
          </label>
          <div className="tab-form-actions">
            <button type="submit" className="run-button" disabled={!data}>
              Watch
            </button>
          </div>
        </form>

        {data && data.watchers.length === 0 && <p className="muted">No watchers yet. Add a place to see its deals here.</p>}
        {data?.watchers.map((watcher) => {
          const found = (deals ?? []).filter((deal) => matches(watcher, deal));
          return (
            <div key={watcher.added} className="day">
              <h3 className="watcher-head">
                {watcher.terms}
                {watcher.maxPrice && ` · under $${watcher.maxPrice}`} <span className="type-count">{found.length}</span>
                <button type="button" className="tag" onClick={() => saveWatchers(data.watchers.filter((w) => w !== watcher))}>
                  Remove
                </button>
              </h3>
              {found.length === 0 ? <p className="muted">No deals right now.</p> : <DealList deals={found} />}
            </div>
          );
        })}
      </section>

      <section className="listing-section">
        <h2>All deals</h2>
        {deals === null || deals.length === 0 ? (
          <p className="muted">Couldn't reach YVR Deals, Air Canada or WestJet at the last build.</p>
        ) : (
          <DealList deals={deals} />
        )}
        <p className="caption">Nothing flying to or through the US. Checked {fmtStamp(builtAt)}, at the last site build.</p>
      </section>
    </div>
  );
}
