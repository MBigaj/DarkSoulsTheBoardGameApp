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
 * The parent owns `open`; Escape, a backdrop click, or any native close calls onClose.
 * Content sits centred; the dialog's own empty area acts as the backdrop.
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
  // A backdrop click must start on the backdrop: a drag from the card that ends there doesn't count.
  const downOnBackdrop = useRef(false);

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
    // Escape goes through the native cancel event, so the click handler needs no key twin.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      aria-label={label}
      className={cx(styles.dialog, className)}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // Chrome's close watcher and method="dialog" forms can close it without a cancel event.
      onClose={() => {
        if (open) onClose();
      }}
      onPointerDown={(e) => {
        downOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (downOnBackdrop.current && e.target === e.currentTarget) onClose();
        downOnBackdrop.current = false;
      }}
    >
      {children}
    </dialog>
  );
}
