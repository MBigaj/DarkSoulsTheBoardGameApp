import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
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

  // Whatever had focus before opening (the tile's link) gets it back on close or unmount
  // (e.g. the Back button removes the dialog). Browsers restore it natively, but not on unmount.
  // Read on the first render, before the dialog takes focus: a dialog that mounts open (the
  // close-up) has no earlier moment. StrictMode's extra effect run can't overwrite it.
  const [focusedAtMount] = useState(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  );
  const opener = useRef(focusedAtMount);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      const focused = document.activeElement;
      if (focused instanceof HTMLElement && !dialog.contains(focused)) opener.current = focused;
      dialog.showModal();
      initialFocusRef?.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
      restoreFocus(opener);
    }
  }, [open, initialFocusRef]);

  useEffect(
    () => () => {
      restoreFocus(opener);
    },
    [],
  );

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

function restoreFocus(opener: { current: HTMLElement | null }) {
  const element = opener.current;
  if (element?.isConnected) element.focus({ preventScroll: true });
}
