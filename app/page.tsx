import { loadListing } from './_daily/data';
import { loadFrankies } from './_daily/frankies';
import Markets from './_home/markets';
import PhotoPick from './_home/photo-pick';
import Tonight from './_home/tonight';
import Weather from './_home/weather';

export const metadata = {
  title: { absolute: 'Home · Daily' },
};

export default async function Home() {
  const shows = await loadFrankies(14);
  const photo = loadListing('photo');

  return (
    <>
      <h1 className="page-title">Today</h1>

      <section className="listing-section">
        <h2>Weather in Vancouver</h2>
        <Weather />
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
    </>
  );
}
