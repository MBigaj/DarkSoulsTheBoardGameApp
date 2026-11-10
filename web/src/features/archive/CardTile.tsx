import { Link, useSearchParams } from 'react-router';
import type { Card } from '@/shared/api/types';
import { badge, statLine, type NameOf } from '@/shared/lib/format';
import { cx } from '@/shared/lib/cx';
import { CardFace } from '@/shared/ui/CardFace';
import { TypeBadge } from '@/shared/ui/TypeBadge';
import type { KeepFocusState } from '@/app/AppShell';
import styles from './CardTile.module.css';

type CardTileProps = { card: Card; code: string | undefined; nameOf: NameOf };

const KEEP: KeepFocusState = { keepFocus: true };

/**
 * Card face, badge, display code and stat line. The whole tile is one link to `?card=<_id>`
 * (the close-up), stretched over the tile from the card name, so no aria-labelledby is needed.
 */
export function CardTile({ card, code, nameOf }: CardTileProps) {
  const [params] = useSearchParams();
  const next = new URLSearchParams(params);
  next.set('card', card._id);
  return (
    <article className={cx(styles.tile, styles.card)}>
      <span className={styles.face}>
        <CardFace name={card.name} type={card.type} art={card.art} />
      </span>
      <h3 className={styles.name}>
        <Link
          className={styles.link}
          to={{ search: next.toString() }}
          preventScrollReset
          state={KEEP}
          aria-haspopup="dialog"
        >
          <span className="visually-hidden">{card.name}</span>
        </Link>
      </h3>
      <p className={styles.row}>
        <TypeBadge type={card.type} {...badge(card)} />
        {code !== undefined && <span className={styles.code}>{code}</span>}
      </p>
      <p className={styles.stat}>{statLine(card, nameOf)}</p>
    </article>
  );
}

/** Same footprint as a tile, shown until the catalog has loaded. */
export function SkeletonTile({ type }: { type: Card['type'] }) {
  return (
    <div className={styles.tile} aria-hidden="true">
      <span className={styles.skeletonFace} data-type={type} />
      <span className={styles.row}>
        <span className={styles.skeletonBadge}>&nbsp;</span>
      </span>
      <span className={styles.stat}>&nbsp;</span>
    </div>
  );
}
