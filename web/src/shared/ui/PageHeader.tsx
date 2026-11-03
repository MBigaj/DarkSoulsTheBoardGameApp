import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

type PageHeaderProps = {
  /** e.g. ['Compendium', 'Card archive', 'Treasure']; the first word is shown in accent text. */
  crumbs: readonly [string, ...string[]];
  title: string;
  lede?: ReactNode;
};

/** Full-width header band: mono breadcrumb, page h1 and italic lede. */
export function PageHeader({ crumbs, title, lede }: PageHeaderProps) {
  const [first, ...rest] = crumbs;
  return (
    <div className={styles.band}>
      <div className={styles.inner}>
        <p className={styles.crumbs}>
          {first}
          {rest.length > 0 && <span className={styles.rest}> / {rest.join(' / ')}</span>}
        </p>
        <h1 className={styles.title}>{title}</h1>
        {lede && <p className={styles.lede}>{lede}</p>}
      </div>
    </div>
  );
}
