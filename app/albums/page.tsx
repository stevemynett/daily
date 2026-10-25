import { loadListing, type Listing } from '../_daily/data';
import RunStatus from '../_daily/run-status';
import AlbumsView from './albums-view';

export const metadata = {
  title: 'Records',
};

const HALF_YEAR = 182 * 24 * 60 * 60 * 1000;

// Headings are like "Fri Nov 20" with no year, so pick the year that puts the date closest to `now`
function releaseDate(heading: string, now: Date): Date | null {
  const parsed = new Date(`${heading.replace(/^\w+\s+/, '')} ${now.getFullYear()}`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.getTime() - now.getTime() > HALF_YEAR) parsed.setFullYear(parsed.getFullYear() - 1);
  else if (now.getTime() - parsed.getTime() > HALF_YEAR) parsed.setFullYear(parsed.getFullYear() + 1);
  return parsed;
}

// Released albums only, as one list, newest first, with no date headings; anything
// dated after today is dropped
function released(listing: Listing): Listing {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const items = listing.groups
    .filter((group) => {
      const date = releaseDate(group.heading, now);
      return !date || date <= today;
    })
    .flatMap((group) => group.items);
  return { ...listing, groups: items.length ? [{ heading: '', items }] : [] };
}

export default function Albums() {
  const listing = loadListing('albums');
  const albums = listing && released(listing);

  return (
    <>
      <div className="title-row">
        <h1 className="page-title">Records</h1>
        <RunStatus job="records" lastRun={listing?.updatedAt ?? null} />
      </div>

      {albums === null ? (
        <section className="listing-section">
          <p className="muted">No listing yet. Run `make records`.</p>
        </section>
      ) : (
        <AlbumsView released={albums} />
      )}
    </>
  );
}
