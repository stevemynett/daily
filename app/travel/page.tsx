import { loadTravel } from '../_home/travel';
import TravelView from './travel-view';

export const metadata = {
  title: 'Travel',
};

export default async function Travel() {
  const deals = await loadTravel({ deals: 30, fares: 30 });

  return (
    <>
      <h1 className="page-title">Travel</h1>
      <TravelView deals={deals} builtAt={new Date().toISOString()} />
    </>
  );
}
