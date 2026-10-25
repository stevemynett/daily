import { loadReport, loadTracked } from './data';
import Jobs from './jobs';

export const metadata = {
  title: 'Jobs',
};

const format = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });

export default function JobsPage() {
  const report = loadReport();
  const { tracked, missed } = loadTracked();

  return (
    <>
      <div className="title-row">
        <h1 className="page-title">Jobs</h1>
        {report && <span className="status-pill">Report from {format(report.date)}</span>}
      </div>
      <section className="listing-section">
        {report === null && (
          <p className="muted">No report yet. Run the job-search skill in ~/Projects/job-hunt/job-search.</p>
        )}
        <Jobs report={report} tracked={tracked} missed={missed} />
      </section>
    </>
  );
}
