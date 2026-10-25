import { loadListing } from './_daily/data';
import { loadFrankies } from './_daily/frankies';
import Agenda from './_home/agenda';
import AirAndUv from './_home/air';
import { loadAirCanada } from './_home/air-canada';
import { loadDeals } from './_home/deals';
import Exchange from './_home/exchange';
import InSeason from './_home/in-season';
import Light from './_home/light';
import Markets from './_home/markets';
import PhotoPick from './_home/photo-pick';
import { loadTides } from './_home/tide-data';
import Tides from './_home/tides';
import JobsStatus from './_home/jobs-status';
import TodayEvents from './_home/today-events';
import Tonight from './_home/tonight';
import Weather from './_home/weather';

export const metadata = {
  title: { absolute: 'Home · Daily' },
};

export default async function Home() {
  const shows = await loadFrankies(14);
  const photo = loadListing('photo');
  const events = loadListing('events');
  const jazz = loadListing('jazz');
  const [deals, tides, airCanada] = await Promise.all([loadDeals(), loadTides(), loadAirCanada()]);

  return (
    <>
      <div className="title-row">
        <h1 className="page-title">Today</h1>
        <JobsStatus />
      </div>

      <section className="listing-section">
        <h2>Weather in Vancouver</h2>
        <Weather />
      </section>

      <section className="listing-section">
        <h2>Light</h2>
        <Light />
      </section>

      <section className="listing-section">
        <h2>Air and UV</h2>
        <AirAndUv />
      </section>

      <section className="listing-section">
        <h2>Tides</h2>
        <Tides data={tides} />
      </section>

      <section className="listing-section">
        <h2>Chime vs. the market</h2>
        <Markets />
      </section>

      <section className="listing-section">
        <h2>USD to CAD</h2>
        <Exchange />
      </section>

      <section className="listing-section">
        <h2>Where to shoot today</h2>
        <PhotoPick listing={photo} />
      </section>

      <section className="listing-section">
        <h2>Tonight at Frankie's</h2>
        <Tonight shows={shows} />
      </section>

      <section className="listing-section">
        <h2>Happening today</h2>
        <TodayEvents listing={events} jazz={jazz} />
      </section>

      <section className="listing-section">
        <h2>Free today</h2>
        <Agenda listings={[events, jazz]} pick="free" />
      </section>

      <section className="listing-section">
        <h2>This weekend</h2>
        <Agenda listings={[events, jazz]} pick="weekend" />
      </section>

      <section className="listing-section">
        <h2>In season</h2>
        <InSeason />
      </section>

      <section className="listing-section">
        <h2>Travel deals from YVR</h2>
        {deals === null || deals.length === 0 ? (
          <p className="muted">Couldn't reach YVR Deals at the last build.</p>
        ) : (
          <ul className="event-list">
            {deals.map((deal) => (
              <li key={deal.url}>
                <a href={deal.url} target="_blank" rel="noopener noreferrer" className="event-name">
                  {deal.title}
                </a>
                {deal.price && <span> · {deal.price}</span>}
                {deal.dates && <span className="event-when">Travel {deal.dates}</span>}
              </li>
            ))}
          </ul>
        )}
        <p className="caption">Latest posts from YVR Deals, refreshed with each build.</p>

        <div className="day">
          <h3>Air Canada sales</h3>
          {airCanada === null ? (
            <p className="muted">Couldn't reach Air Canada at the last build.</p>
          ) : airCanada.sales.length === 0 ? (
            <p className="muted">No sales on right now.</p>
          ) : (
            <ul className="event-list">
              {airCanada.sales.map((sale) => (
                <li key={sale.title}>
                  <a href={sale.url} target="_blank" rel="noopener noreferrer" className="event-name">
                    {sale.title}
                  </a>
                  <span className="event-when">
                    {[sale.travel && `Travel ${sale.travel}`, `Book by ${sale.bookBy}`, sale.code && `Code ${sale.code}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {airCanada && airCanada.fares.length > 0 && (
          <div className="day">
            <h3>Air Canada lowest fares from YVR</h3>
            <ul className="event-list">
              {airCanada.fares.slice(0, 8).map((fare) => (
                <li key={fare.city}>
                  <a href={fare.url} target="_blank" rel="noopener noreferrer" className="event-name">
                    {fare.city}, {fare.price} {fare.trip}
                  </a>
                  <span className="event-when">{fare.dates}</span>
                </li>
              ))}
            </ul>
            <p className="caption">Sample dates Air Canada has seen at that price; nearby dates can differ.</p>
          </div>
        )}
      </section>
    </>
  );
}
