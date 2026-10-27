import SavedTabs from './saved-tabs';

export const metadata = {
  title: 'To Read',
};

export default function Tabs() {
  return (
    <>
      <h1 className="page-title">To Read</h1>
      <SavedTabs list="read" />
    </>
  );
}
