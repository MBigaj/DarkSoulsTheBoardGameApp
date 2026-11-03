import type { ComponentPropsWithRef } from 'react';
import { cx } from '@/shared/lib/cx';
import styles from './Pill.module.css';

type PillProps = Omit<ComponentPropsWithRef<'button'>, 'onChange'> & {
  selected: boolean;
  onChange: (selected: boolean) => void;
};

/** Filter option toggle. */
export function Pill({ selected, onChange, className, ...rest }: PillProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(styles.pill, className)}
      onClick={() => {
        onChange(!selected);
      }}
      {...rest}
    />
  );
}
