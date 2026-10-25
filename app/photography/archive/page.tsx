import { loadShows } from './data';
import Shows from './shows';

export const metadata = {
  title: 'Archive',
};

export default function Archive() {
  const shows = loadShows();

  return (
    <div className="wide">
      <h1 className="page-title">Archive</h1>
      <p className="muted">
        Photos from The Cellar and Frankie's, grouped by show. Musicians marked * are a likely lineup that I could
        not confirm for that exact date.
      </p>
      <Shows shows={shows} />
    </div>
  );
}
