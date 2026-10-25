import { loadConcerts } from '../lightroom';

export const metadata = {
  title: 'Editing',
};

// Five steps from red (nothing edited) to green (all edited); the label backs up the colour
function band(edited: number, photos: number) {
  if (edited === 0) return { band: 'none', label: 'Not started' };
  if (edited === photos) return { band: 'done', label: 'Done' };
  // Under 25% counts as not edited yet
  if (edited * 4 < photos) return { band: 'low', label: 'Barely started' };
  if (edited * 4 < photos * 3) return { band: 'mid', label: 'Partway' };
  return { band: 'high', label: 'Nearly done' };
}

export default function Editing() {
  const lightroom = loadConcerts();
  const unedited = lightroom?.concerts.filter((c) => c.edited * 4 < c.photos).length ?? 0;

  return (
    <>
      <h1 className="page-title">Editing</h1>
      {lightroom === null ? (
        <p className="muted">Couldn't read the Lightroom catalog at the last build.</p>
      ) : (
        <>
          <p className="muted">
            From the Lightroom catalog as of{' '}
            {new Date(lightroom.updatedAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}.{' '}
            {unedited} of {lightroom.concerts.length} concerts have under 25% of photos edited.
          </p>

          <section className="listing-section">
            <table className="job-table">
              <thead>
                <tr>
                  <th>Concert</th>
                  <th>Edited</th>
                  <th>Complete</th>
                  <th>Shot</th>
                </tr>
              </thead>
              <tbody>
                {lightroom.concerts.map((row) => {
                  const pct = Math.floor((100 * row.edited) / row.photos);
                  const { band: level, label } = band(row.edited, row.photos);
                  return (
                    <tr key={row.path} className="edit-row" data-band={level}>
                      <td>{row.path}</td>
                      <td className="job-date">
                        {row.edited} of {row.photos}
                      </td>
                      <td>
                        <span className="edit-progress" title={label}>
                          <span className="edit-bar">
                            <span style={{ width: `${pct}%` }} />
                          </span>
                          <span className="edit-pct">{pct}%</span>
                          <span className="edit-label">{label}</span>
                        </span>
                      </td>
                      <td className="job-date">{row.shot}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </>
      )}
    </>
  );
}
