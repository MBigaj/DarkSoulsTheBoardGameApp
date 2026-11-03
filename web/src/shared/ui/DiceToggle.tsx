import { DICE, type Die } from '@/shared/lib/card-types';
import { cx } from '@/shared/lib/cx';
import styles from './DiceToggle.module.css';

type DiceToggleProps = {
  selected: readonly Die[];
  onToggle: (die: Die) => void;
  className?: string;
};

/** Three-column dice picker: swatch plus mono label per die. Place it in a FilterField for its name. */
export function DiceToggle({ selected, onToggle, className }: DiceToggleProps) {
  return (
    <div className={cx(styles.grid, className)}>
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
