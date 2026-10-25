import { loadListing } from '../_daily/data';
import ListingView from '../_daily/listing';
import RunStatus from '../_daily/run-status';
import { dayKey, loadCalendar, timeRange, type CalendarEvent } from './calendar';

export const metadata = {
  title: 'Events',
};

export default async function Events() {
  const [calendar, listing] = await Promise.all([loadCalendar(), loadListing('events')]);

  const days = new Map<string, CalendarEvent[]>();
  for (const event of calendar ?? []) {
    const key = dayKey(event);
    days.set(key, [...(days.get(key) ?? []), event]);
  }

  return (
    <>
      <div className="title-row">
        <h1 className="page-title">Events</h1>
        <RunStatus lastRun={listing?.updatedAt ?? null} />
      </div>

      <section className="listing-section">
        <h2>Around Vancouver</h2>
        {listing === null ? (
          <p className="muted">No listing yet. Run `make daily`.</p>
        ) : (
          <ListingView listing={listing} sections />
        )}
        {listing?.footer && <p className="caption">{listing.footer}</p>}
      </section>

      <section className="listing-section">
        <h2>Calendar</h2>
        {calendar === null ? (
          <p className="muted">No calendar connected. Set ICAL_URL in .env.local and rebuild.</p>
        ) : days.size === 0 ? (
          <p className="muted">Nothing on the calendar for the next two weeks.</p>
        ) : (
          [...days].map(([day, events]) => (
            <div key={day} className="day">
              <h3>{day}</h3>
              <ul className="event-list">
                {events.map((event, i) => (
                  <li key={i}>
                    <span className="event-when">{timeRange(event)}</span>
                    <span className="event-name">{event.title}</span>
                    {event.location && <span className="muted"> · {event.location}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </>
  );
}
