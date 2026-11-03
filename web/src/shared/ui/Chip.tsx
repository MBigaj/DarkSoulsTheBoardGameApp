import type { ReactNode } from 'react';
import { cx } from '@/shared/lib/cx';
import { CloseIcon } from './icons';
import styles from './Chip.module.css';

type ChipProps = {
  label: string;
  onRemove: () => void;
  className?: string;
};

/** A removable active-filter chip. */
export function Chip({ label, onRemove, className }: ChipProps) {
  return (
    <button
      type="button"
      className={cx(styles.chip, className)}
      aria-label={`Remove filter ${label}`}
      onClick={onRemove}
    >
      {label}
      <CloseIcon />
    </button>
  );
}

type ChipRowProps = {
  children: ReactNode;
  onClearAll: () => void;
  className?: string;
};

/** Active chips followed by a "Clear all" link. */
export function ChipRow({ children, onClearAll, className }: ChipRowProps) {
  return (
    <div className={cx(styles.row, className)}>
      {children}
      <button type="button" className={styles.clear} onClick={onClearAll}>
        Clear all
      </button>
    </div>
  );
}
