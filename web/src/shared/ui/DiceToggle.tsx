import { DICE, type Die } from '@/shared/lib/card-types';
import { cx } from '@/shared/lib/cx';
import styles from './DiceToggle.module.css';

type DiceToggleProps = {
  /** Accessible name for the group, e.g. "Attack dice". */
  label: string;
  selected: readonly Die[];
  onToggle: (die: Die) => void;
  className?: string;
};

/** Three-column dice picker: swatch plus mono label per die. */
export function DiceToggle({ label, selected, onToggle, className }: DiceToggleProps) {
  return (
    <div role="group" aria-label={label} className={cx(styles.grid, className)}>
      {DICE.map((die) => (
        <button
          key={die}
          type="button"
          aria-pressed={selected.includes(die)}
          className={styles.die}
          onClick={() => {
            onToggle(die);
          }}
        >
          <span className={cx(styles.swatch, styles[die])} aria-hidden="true" />
          {die}
        </button>
      ))}
    </div>
  );
}
