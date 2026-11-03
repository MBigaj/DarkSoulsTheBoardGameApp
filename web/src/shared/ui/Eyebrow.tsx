import type { HTMLAttributes } from 'react';
import { cx } from '@/shared/lib/cx';
import styles from './Eyebrow.module.css';

type EyebrowProps = HTMLAttributes<HTMLElement> & {
  tone?: 'accent' | 'muted';
  as?: 'span' | 'p';
};

/** Mono caps label used above headings and for legends. */
export function Eyebrow({ tone = 'accent', as: Tag = 'span', className, ...rest }: EyebrowProps) {
  return <Tag className={cx(styles.eyebrow, styles[tone], className)} {...rest} />;
}
