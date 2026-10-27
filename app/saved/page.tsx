import SavedTabs from '../tabs/saved-tabs';

export const metadata = {
  title: 'Saved',
};

export default function Saved() {
  return (
    <>
      <h1 className="page-title">Saved</h1>
      <SavedTabs list="saved" />
    </>
  );
}
