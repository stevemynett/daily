import { loadFrankies } from '../_daily/frankies';

export const metadata = {
  title: { absolute: 'Photography · Daily' },
};

export default async function Photography() {
  const shows = await loadFrankies();

  return (
    <>
      <h1 className="page-title">Photography</h1>
      <section className="listing-section">
        <h2>Upcoming at Frankie's</h2>
        {shows === null ? (
          <p className="muted">Couldn't reach Frankie's calendar at the last build.</p>
        ) : shows.length === 0 ? (
          <p className="muted">Nothing listed for the next month.</p>
        ) : (
          <ol className="show-list">
            {shows
              .filter((show, i) => shows.findIndex((s) => s.day === show.day && s.name === show.name) === i)
              .map((show) => {
                const at = new Date(show.start);
                const part = (options: Intl.DateTimeFormatOptions) =>
                  at.toLocaleDateString('en-CA', { timeZone: 'America/Vancouver', ...options });
                return (
                  <li key={show.start}>
                    <a href={show.url} target="_blank" rel="noopener noreferrer" className="show-row">
                      <time dateTime={show.day} className="show-date">
                        <span className="show-weekday">{part({ weekday: 'short' })}</span>
                        <span className="show-day">{part({ day: 'numeric' })}</span>
                        <span className="show-month">{part({ month: 'short' })}</span>
                      </time>
                      <span className="show-title">{show.name}</span>
                    </a>
                  </li>
                );
              })}
          </ol>
        )}
      </section>
    </>
  );
}
