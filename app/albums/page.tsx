import { loadListing, type Listing } from '../_daily/data';
import ListingView from '../_daily/listing';
import RunStatus from '../_daily/run-status';

export const metadata = {
  title: 'Albums',
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

function split(listing: Listing) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const released: Listing['groups'] = [];
  const upcoming: Listing['groups'] = [];
  for (const group of listing.groups) {
    const date = releaseDate(group.heading, now);
    (date && date > today ? upcoming : released).push(group);
  }
  return {
    released: { ...listing, groups: released },
    upcoming: { ...listing, groups: upcoming.reverse() },
  };
}

export default function Albums() {
  const listing = loadListing('albums');
  const sections = listing && split(listing);

  return (
    <>
      <div className="title-row">
        <h1 className="page-title">Albums</h1>
        <RunStatus lastRun={listing?.updatedAt ?? null} />
      </div>

      {sections === null ? (
        <section className="listing-section">
          <p className="muted">No listing yet. Run `make daily`.</p>
        </section>
      ) : (
        <>
          <section className="listing-section">
            <h2>Upcoming releases</h2>
            {sections.upcoming.groups.length === 0 ? (
              <p className="muted">No upcoming releases.</p>
            ) : (
              <ListingView listing={sections.upcoming} />
            )}
          </section>

          <section className="listing-section">
            <h2>Already released</h2>
            {sections.released.groups.length === 0 ? (
              <p className="muted">Nothing released yet.</p>
            ) : (
              <ListingView listing={sections.released} />
            )}
            {sections.released.footer && <p className="caption">{sections.released.footer}</p>}
          </section>
        </>
      )}
    </>
  );
}
