import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { cx } from '@/shared/lib/cx';
import styles from './Dialog.module.css';

type DialogProps = {
  open: boolean;
  onClose: () => void;
  /** Accessible name, e.g. "Fireball close-up". */
  label: string;
  /** Element to focus when the dialog opens (the close-up focuses Close). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
};

/**
 * Modal built on native <dialog> (focus trap, top layer, focus restored on close).
 * Escape and clicks on the backdrop call onClose; the parent owns `open`.
 * Content sits centred; a click that lands on the dialog itself, not its content, is a backdrop click.
 */
export function Dialog({
  open,
  onClose,
  label,
  initialFocusRef,
  children,
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      initialFocusRef?.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, initialFocusRef]);

  return (
    // Escape is handled through the native cancel event, so the click handler needs no key twin.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      aria-label={label}
      aria-modal="true"
      className={cx(styles.dialog, className)}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
