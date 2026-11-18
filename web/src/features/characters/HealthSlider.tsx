import { useId, type CSSProperties } from 'react';
import styles from './HealthSlider.module.css';

type HealthSliderProps = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

/** Values with a number over their pipe; every other value gets a short pipe. */
const LABELLED = [1, 5, 10, 15, 20, 25, 30, 35, 40];

/**
 * "Enemy health" (owner, 18 Nov): a thick filled bar with a pipe per value and numbers on top, and a
 * vertical cursor at the value. A transparent native range input sits over it, so dragging,
 * clicking a pipe, the keyboard and screen readers all work as for any slider.
 */
export function HealthSlider({ value, min, max, onChange }: HealthSliderProps) {
  const id = useId();
  const at = (v: number) => (v - min) / (max - min);
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div className={styles.slider}>
      <span className={styles.head}>
        <label htmlFor={id}>Enemy health</label>
        <output htmlFor={id} className={styles.value}>
          {value}
        </output>
      </span>
      <div className={styles.scale} style={{ '--at': at(value) } as CSSProperties}>
        <span className={styles.ticks} aria-hidden="true">
          {values.map((v) => {
            const labelled = LABELLED.includes(v);
            return (
              <span
                key={v}
                className={styles.tick}
                data-labelled={labelled || undefined}
                data-current={v === value || undefined}
                style={{ '--at': at(v) } as CSSProperties}
              >
                {labelled && <span className={styles.tickLabel}>{v}</span>}
              </span>
            );
          })}
        </span>
        <span className={styles.track} aria-hidden="true">
          <span className={styles.fill} />
        </span>
        <span className={styles.cursor} aria-hidden="true" />
        <input
          id={id}
          type="range"
          className={styles.input}
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => {
            onChange(e.currentTarget.valueAsNumber);
          }}
        />
      </div>
    </div>
  );
}
