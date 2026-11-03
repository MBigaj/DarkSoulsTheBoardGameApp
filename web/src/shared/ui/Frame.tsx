import type { HTMLAttributes } from 'react';
import { cx } from '@/shared/lib/cx';
import styles from './Frame.module.css';

type FrameProps = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'aside' | 'article';
};

/** Framed panel: 1px border plus ornament corner brackets top-left and bottom-right. */
export function Frame({ as: Tag = 'div', className, ...rest }: FrameProps) {
  return <Tag className={cx(styles.frame, className)} {...rest} />;
}
