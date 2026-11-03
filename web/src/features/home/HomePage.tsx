import { PageHeader } from '@/shared/ui/PageHeader';

// Placeholder route. The real Home page is built in milestone M3.
export function HomePage() {
  return (
    <>
      <title>Bonfire Ledger</title>
      <PageHeader
        crumbs={['Compendium']}
        title="Bonfire Ledger"
        lede="Unofficial companion for Dark Souls™: The Board Game. The home page arrives in M3."
      />
    </>
  );
}
