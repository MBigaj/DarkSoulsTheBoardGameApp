import { cx } from '@/shared/lib/cx';
import styles from './ArtSlot.module.css';
import frameStyles from './Frame.module.css';

type ArtSlotProps = {
  /** Mono caps label, e.g. "Key art" or "Box art". */
  label: string;
  /** Italic line under the label, e.g. "[Licensed box art, supplied by owner]". */
  note?: string;
  /** CSS aspect-ratio, e.g. "16 / 7" or "4 / 5". */
  ratio?: string;
  /** Adds the framed-panel corner brackets. */
  framed?: boolean;
  /** Crimson glow under the slot (Home hero). */
  glow?: boolean;
  /** Hidden from assistive tech, e.g. inside a link that is already named. */
  decorative?: boolean;
  className?: string;
};

/** Labelled, hatched placeholder for owner-supplied art that hasn't been uploaded yet. */
export function ArtSlot({ label, note, ratio, framed, glow, decorative, className }: ArtSlotProps) {
  return (
    <div
      className={cx(
        styles.slot,
        framed && frameStyles.frame,
        framed && styles.framed,
        glow && styles.glow,
        className,
      )}
      style={ratio ? { aspectRatio: ratio } : undefined}
      {...(decorative
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': note ? `${label}: ${note}` : `${label} placeholder` })}
    >
      <span className={styles.label}>{label}</span>
      {note && <span className={styles.note}>{note}</span>}
    </div>
  );
}
