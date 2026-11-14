import type { ClassDef } from '@/shared/api/types';
import { cx } from '@/shared/lib/cx';
import { STATS, type Stat, type Tier, type Tiers } from './builder/builderReducer';
import { STAT_LABELS } from './classes';
import styles from './StatProgression.module.css';

const TIERS: readonly Tier[] = [0, 1, 2, 3];
const TIER_NAMES = ['base', 'tier 1', 'tier 2', 'tier 3'];

type StatProgressionProps = {
  cls: ClassDef;
  tiers: Tiers;
  onSetTier: (stat: Stat, tier: Tier) => void;
  onReset: () => void;
};

/** The class's stat tracks: click a tier to buy up to it (2 / 4 / 8 souls). */
export function StatProgression({ cls, tiers, onSetTier, onReset }: StatProgressionProps) {
  return (
    <section className={styles.panel} aria-labelledby="stats-title">
      <div className={styles.head}>
        <h2 id="stats-title" className={styles.title}>
          Stat progression
        </h2>
        <div className={styles.headSide}>
          <span>
            Upgrade cost <span className={styles.accent}>2 / 4 / 8 souls</span>
          </span>
          <button type="button" className={styles.reset} onClick={onReset}>
            Reset
          </button>
        </div>
      </div>
      <div className={styles.scroll}>
        <div className={styles.table}>
          <div className={styles.row} data-header="">
            <span className={styles.wideOnly} />
            <span className={styles.wideOnly}>Attribute</span>
            <span className={styles.center}>Base</span>
            <span className={styles.center}>Tier 1 · 2</span>
            <span className={styles.center}>Tier 2 · 4</span>
            <span className={styles.center}>Tier 3 · 8</span>
            <span className={cx(styles.right, styles.wideOnly)}>Current</span>
          </div>
          {STATS.map((stat) => {
            const { code, name } = STAT_LABELS[stat];
            const track = cls.stats[stat];
            const owned = tiers[stat];
            return (
              <div key={stat} className={styles.row} role="group" aria-label={name}>
                <span className={styles.code}>{code}</span>
                <span className={styles.name}>{name}</span>
                {TIERS.map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    className={styles.tier}
                    aria-label={`${name} ${TIER_NAMES[tier] ?? ''}: ${String(track[tier])}`}
                    aria-pressed={tier === owned}
                    data-owned={tier <= owned || undefined}
                    onClick={() => {
                      onSetTier(stat, tier);
                    }}
                  >
                    <span className={styles.pip} aria-hidden="true" />
                    {track[tier]}
                  </button>
                ))}
                <span className={styles.current}>{track[owned]}</span>
              </div>
            );
          })}
        </div>
      </div>
      <p className={styles.note}>
        Tap a tier to buy up to it. Tiers are bought in order, only at the bonfire.
      </p>
    </section>
  );
}
