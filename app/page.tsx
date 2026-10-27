import { loadListing } from './_daily/data';
import { loadFrankies } from './_daily/frankies';
import Agenda from './_home/agenda';
import AirAndUv from './_home/air';
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
  const tides = await loadTides();

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
        <h2>In season</h2>
        <InSeason />
      </section>
    </>
  );
}
