import { useState, type ReactNode } from 'react';
import { cx } from '@/shared/lib/cx';
import { ChevronDownIcon } from './icons';
import styles from './FilterGroup.module.css';

type FilterGroupProps = {
  title: string;
  /** Selected options across the group's filters; the badge shows when > 0. */
  count?: number;
  /** Initial state only. After that, only the viewer opens or closes the group. */
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

/** Collapsible rail group built on <details>. */
export function FilterGroup({
  title,
  count = 0,
  defaultOpen = false,
  children,
  className,
}: FilterGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      className={cx(styles.group, className)}
      open={open}
      onToggle={(e) => {
        setOpen(e.currentTarget.open);
      }}
    >
      <summary className={styles.summary}>
        <span className={styles.title}>{title}</span>
        {count > 0 && (
          <span className={styles.badge}>
            {count}
            <span className="visually-hidden"> selected</span>
          </span>
        )}
        <ChevronDownIcon className={styles.chevron} />
      </summary>
      <div className={styles.body}>{children}</div>
    </details>
  );
}

type FilterFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

/** One labelled filter inside a group (pills, checks, dice or sliders). */
export function FilterField({ label, children, className }: FilterFieldProps) {
  return (
    <div role="group" aria-label={label} className={cx(styles.field, className)}>
      <span className={styles.fieldLabel} aria-hidden="true">
        {label}
      </span>
      {children}
    </div>
  );
}
