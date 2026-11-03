import { ButtonLink } from '@/shared/ui/Button';
import { PageHeader } from '@/shared/ui/PageHeader';
import styles from './StatusPage.module.css';

export function NotFound() {
  return (
    <>
      <title>Not found · Bonfire Ledger</title>
      <PageHeader
        crumbs={['Compendium', 'Not found']}
        title="Lost in the dark"
        lede="There is no page at this address."
      />
      <div className={styles.body}>
        <ButtonLink to="/">Return to the bonfire</ButtonLink>
        <ButtonLink to="/cards" variant="ghost">
          Open the archive
        </ButtonLink>
      </div>
    </>
  );
}
