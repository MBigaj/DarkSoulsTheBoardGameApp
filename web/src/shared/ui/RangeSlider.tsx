import { useId } from 'react';
import { cx } from '@/shared/lib/cx';
import styles from './RangeSlider.module.css';

type RangeSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Text shown on the right, e.g. "Any" at the default end or "≤ 25". Defaults to the value. */
  display?: (value: number) => string;
  /** Fuller accessible name when the visible label is short (e.g. "Maximum STR requirement"). */
  ariaLabel?: string;
  className?: string;
};

/** Native range input: label left, current value right in accent text. */
export function RangeSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  display = String,
  ariaLabel,
  className,
}: RangeSliderProps) {
  const id = useId();
  const shown = display(value);
  return (
    <div className={cx(styles.slider, className)}>
      <span className={styles.head}>
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className={styles.value}>
          {shown}
        </output>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        aria-valuetext={shown === String(value) ? undefined : shown}
        onChange={(e) => {
          onChange(e.currentTarget.valueAsNumber);
        }}
      />
    </div>
  );
}
