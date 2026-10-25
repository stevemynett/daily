import SavedTabs from './saved-tabs';

export const metadata = {
  title: 'Saved Tabs',
};

export default function Tabs() {
  return (
    <>
      <h1 className="page-title">Saved Tabs</h1>
      <SavedTabs />
    </>
  );
}
