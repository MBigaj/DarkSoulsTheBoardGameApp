import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cx } from '@/shared/lib/cx';
import styles from './Button.module.css';

type Variant = 'primary' | 'ghost';

type ButtonProps = ComponentPropsWithRef<'button'> & { variant?: Variant };

export function Button({ variant = 'primary', className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={cx(styles.button, styles[variant], className)} {...rest} />;
}

type ButtonLinkProps = LinkProps & { variant?: Variant; children: ReactNode };

/** A navigation link styled as a button (e.g. the Home hero actions). */
export function ButtonLink({ variant = 'primary', className, ...rest }: ButtonLinkProps) {
  return (
    <Link
      className={cx(styles.button, styles[variant], typeof className === 'string' && className)}
      {...rest}
    />
  );
}
