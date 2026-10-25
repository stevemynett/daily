import { loadListing } from '../_daily/data';
import ListingView from '../_daily/listing';
import RunStatus from '../_daily/run-status';

export const metadata = {
  title: 'Food',
};

export default function Food() {
  const listing = loadListing('food');

  return (
    <>
      <div className="title-row">
        <h1 className="page-title">Food</h1>
        <RunStatus lastRun={listing?.updatedAt ?? null} />
      </div>

      <section className="listing-section">
        {listing === null ? <p className="muted">No listing yet. Run `make daily`.</p> : <ListingView listing={listing} sections filters={false} />}
        {listing?.footer && <p className="caption">{listing.footer}</p>}
      </section>
    </>
  );
}
