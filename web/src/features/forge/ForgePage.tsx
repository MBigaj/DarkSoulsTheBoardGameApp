import { PageHeader } from '@/shared/ui/PageHeader';

// Placeholder for /forge and /forge/:id until FE-19 (Forge controls rail) replaces it.
export function ForgePage() {
  return (
    <>
      <title>Encounter Forge · Bonfire Ledger</title>
      <PageHeader
        crumbs={['Compendium', 'Encounter forge']}
        title="Encounter Forge"
        lede="Coming soon."
      />
    </>
  );
}
