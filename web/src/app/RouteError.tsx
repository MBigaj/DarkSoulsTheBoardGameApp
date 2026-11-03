import { isRouteErrorResponse, useRouteError } from 'react-router';
import { Button, ButtonLink } from '@/shared/ui/Button';
import { PageHeader } from '@/shared/ui/PageHeader';
import { NotFound } from './NotFound';
import styles from './StatusPage.module.css';

/** Error boundary for every route; renders inside the shell, so nav and footer stay. */
export function RouteError() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />;

  const detail = error instanceof Error ? error.message : String(error);
  return (
    <>
      <title>Something went wrong · Bonfire Ledger</title>
      <PageHeader
        crumbs={['Compendium', 'Error']}
        title="You died"
        lede="Something went wrong while loading this page. Try again, or head back to the bonfire."
      />
      <div className={styles.body}>
        <Button
          onClick={() => {
            window.location.reload();
          }}
        >
          Try again
        </Button>
        <ButtonLink to="/" variant="ghost">
          Return to the bonfire
        </ButtonLink>
        {import.meta.env.DEV && <pre className={styles.detail}>{detail}</pre>}
      </div>
    </>
  );
}
