import RunStatus from '../_daily/run-status';
import BriefingView from './briefing-view';
import { loadBriefing } from './data';

export const metadata = {
  title: 'News',
};

export default function BriefingPage() {
  const briefing = loadBriefing();

  return (
    <>
      <div className="title-row">
        <h1 className="page-title">News</h1>
        <RunStatus job="briefing" lastRun={briefing?.updatedAt ?? null} />
      </div>

      {briefing === null ? <p className="muted">No news yet. Run `make briefing`.</p> : <BriefingView briefing={briefing} />}
    </>
  );
}
