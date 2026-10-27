import StatsView from './stats-view';

export const metadata = {
  title: 'Stats',
};

export default function Stats() {
  return (
    <>
      <h1 className="page-title">Stats</h1>
      <StatsView />
    </>
  );
}
