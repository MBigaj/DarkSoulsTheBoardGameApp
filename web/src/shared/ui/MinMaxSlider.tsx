import { cx } from '@/shared/lib/cx';
import { RangeSlider } from './RangeSlider';
import styles from './MinMaxSlider.module.css';

type MinMaxSliderProps = {
  /** e.g. "Threat level"; names the inputs "Minimum threat level" and "Maximum threat level". */
  label: string;
  value: readonly [min: number, max: number];
  min: number;
  max: number;
  onChange: (value: [min: number, max: number]) => void;
  className?: string;
};

/**
 * Two range inputs, Min and Max. Each one stops at the other, so min ≤ max always holds.
 * Place it in a FilterField for the group name.
 */
export function MinMaxSlider({ label, value, min, max, onChange, className }: MinMaxSliderProps) {
  const [lo, hi] = value;
  return (
    <div className={cx(styles.group, className)}>
      <RangeSlider
        label="Min"
        ariaLabel={`Minimum ${label.toLowerCase()}`}
        value={lo}
        min={min}
        max={max}
        onChange={(next) => {
          onChange([Math.min(next, hi), hi]);
        }}
      />
      <RangeSlider
        label="Max"
        ariaLabel={`Maximum ${label.toLowerCase()}`}
        value={hi}
        min={min}
        max={max}
        onChange={(next) => {
          onChange([lo, Math.max(next, lo)]);
        }}
      />
    </div>
  );
}
