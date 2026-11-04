import { useParams } from 'react-router';
import { NotFound } from '@/app/NotFound';
import { PageHeader } from '@/shared/ui/PageHeader';
import { tabForSlug } from './tabs';

// Placeholder until FE-12 (Archive page tabs and card grid) replaces it.
export function ArchivePage() {
  const { type } = useParams();
  const tab = tabForSlug(type);
  if (type !== undefined && !tab) return <NotFound />;

  const title = tab?.label ?? 'Card Archive';
  return (
    <>
      <title>{`${title} · Bonfire Ledger`}</title>
      <PageHeader
        crumbs={tab ? ['Compendium', 'Card archive', tab.label] : ['Compendium', 'Card archive']}
        title={title}
        lede="Coming soon."
      />
    </>
  );
}
