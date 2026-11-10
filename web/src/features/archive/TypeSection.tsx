import { Link, type To } from 'react-router';
import type { Card } from '@/shared/api/types';
import type { NameOf } from '@/shared/lib/format';
import { CardTile, SkeletonTile } from './CardTile';
import type { ArchiveTab } from './tabs';
import styles from './TypeSection.module.css';

type TypeSectionProps = {
  tab: ArchiveTab;
  cards: readonly Card[];
  /** Matching cards in the whole catalog; undefined while it loads. */
  total: number | undefined;
  /** Skeleton tiles to show after the cards while the catalog loads. */
  skeletons: number;
  codes: ReadonlyMap<string, string>;
  nameOf: NameOf;
  /** All types: link to the type page ("View all N →"). */
  viewAll?: To;
  /** Section heading level: h2 on All types, visually hidden on a type page (the h1 names it). */
  heading: 'visible' | 'hidden';
};

export function TypeSection({
  tab,
  cards,
  total,
  skeletons,
  codes,
  nameOf,
  viewAll,
  heading,
}: TypeSectionProps) {
  const headingId = `section-${tab.slug}`;
  const empty = total === 0;
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <div className={heading === 'visible' ? styles.head : 'visually-hidden'}>
        <div className={styles.titleBlock}>
          <div className={styles.titleRow}>
            <span className={styles.diamond} data-type={tab.type} aria-hidden="true" />
            <h2 id={headingId} className={styles.title}>
              {tab.label}
            </h2>
            {total !== undefined && (
              <span className={styles.count}>
                {total} {total === 1 ? 'card' : 'cards'}
              </span>
            )}
          </div>
          <p className={styles.blurb}>{tab.blurb}</p>
        </div>
        {viewAll !== undefined && total !== undefined && total > 0 && (
          <Link className={styles.viewAll} to={viewAll} state={{ keepFocus: true }}>
            View all {total} →
          </Link>
        )}
      </div>
      {empty ? (
        <p className={styles.empty}>
          Nothing stirs in the dark. No {tab.lower} match these filters.
        </p>
      ) : (
        <div className={styles.grid} data-type={tab.type}>
          {cards.map((card) => (
            <CardTile key={card._id} card={card} code={codes.get(card._id)} nameOf={nameOf} />
          ))}
          {/* Keyed by grid slot, so a skeleton stays put while cards fill the slots before it. */}
          {Array.from({ length: skeletons }, (_, i) => (
            <SkeletonTile key={`slot-${String(cards.length + i)}`} type={tab.type} />
          ))}
        </div>
      )}
    </section>
  );
}
