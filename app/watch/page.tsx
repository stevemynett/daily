import WatchView from './watch-view';

export const metadata = {
  title: 'Watch',
};

export default function Watch() {
  return (
    <>
      <h1 className="page-title">What to watch</h1>
      <WatchView />
    </>
  );
}
