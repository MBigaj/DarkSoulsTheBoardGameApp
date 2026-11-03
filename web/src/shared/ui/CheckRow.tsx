import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from '@/shared/lib/cx';
import styles from './CheckRow.module.css';

type CheckRowProps = Omit<ComponentPropsWithRef<'button'>, 'onChange' | 'children'> & {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  /** Shown in a mono box on the right (e.g. card counts per core set). */
  count?: number;
  /** 44px rows with larger text, as used for the core-set list. */
  size?: 'md' | 'lg';
};

export function CheckRow({
  checked,
  onChange,
  label,
  count,
  size = 'md',
  className,
  ...rest
}: CheckRowProps) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      className={cx(styles.row, size === 'lg' && styles.lg, className)}
      onClick={() => {
        onChange(!checked);
      }}
      {...rest}
    >
      <span className={styles.box} aria-hidden="true">
        {checked ? '✓' : null}
      </span>
      <span className={styles.label}>{label}</span>
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </button>
  );
}
