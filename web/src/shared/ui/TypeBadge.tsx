import type { CardType } from '@/shared/lib/card-types';
import { cx } from '@/shared/lib/cx';
import styles from './TypeBadge.module.css';

const LABEL: Record<CardType, string> = {
  treasure: 'Treasure',
  enemy: 'Enemy',
  boss: 'Boss',
  behaviour: 'Behaviour',
  encounter: 'Encounter',
  event: 'Event',
};

type TypeBadgeProps = {
  type: CardType;
  /** Replaces the type name, keeping its colour (e.g. "Rare", "Boss drop", "Main boss"). */
  label?: string;
  className?: string;
};

/** Outlined mono badge in the card type's fixed colour. */
export function TypeBadge({ type, label, className }: TypeBadgeProps) {
  return <span className={cx(styles.badge, styles[type], className)}>{label ?? LABEL[type]}</span>;
}
