import type { Treasure } from '@/shared/api/types';
import { upgradeCost } from './builder/gear';
import styles from './Upgrades.module.css';

type UpgradesProps = {
  host: Treasure;
  /** Upgrade ids on this card, in the order they went on. */
  attached: readonly string[];
  cardOf: (id: string) => Treasure | undefined;
  onAdd: () => void;
  onInspect: (upgrade: Treasure) => void;
  onRemove: (upgrade: Treasure) => void;
};

/**
 * The card's printed upgrade slots (hexagons): one row per upgrade on it (a 2-slot one fills two
 * slots in one taller row), then a dashed "Add upgrade" row per free slot.
 */
export function Upgrades({ host, attached, cardOf, onAdd, onInspect, onRemove }: UpgradesProps) {
  const upgrades = attached.flatMap((id) => cardOf(id) ?? []);
  const used = upgrades.reduce((sum, upgrade) => sum + upgradeCost(upgrade), 0);
  const free = Math.max(0, host.upgradeSlots - used);
  return (
    <div className={styles.upgrades} data-upgrades-of={host._id}>
      <div className={styles.head}>
        <span>Upgrades</span>
        <span className={used > 0 ? styles.used : undefined}>
          {used} / {host.upgradeSlots}
        </span>
      </div>
      {host.upgradeSlots === 0 && <span className={styles.none}>No upgrade slots</span>}
      {upgrades.map((upgrade) => (
        <div key={upgrade._id} className={styles.socket} data-cost={upgradeCost(upgrade)}>
          <button
            type="button"
            className={styles.name}
            aria-label={`${upgrade.name}: what it does`}
            onClick={() => {
              onInspect(upgrade);
            }}
          >
            <span className={styles.hex} aria-hidden="true" />
            <span className={styles.nameText}>
              {upgrade.name}
              {upgradeCost(upgrade) > 1 && (
                <small className={styles.cost}>Takes {upgradeCost(upgrade)} slots</small>
              )}
            </span>
          </button>
          <button
            type="button"
            className={styles.remove}
            aria-label={`Remove ${upgrade.name} from ${host.name}`}
            onClick={() => {
              onRemove(upgrade);
            }}
          >
            ×
          </button>
        </div>
      ))}
      {Array.from({ length: free }, (_, i) => (
        <button
          key={i}
          type="button"
          className={styles.add}
          aria-label={`Add upgrade to ${host.name}`}
          onClick={onAdd}
        >
          <span className={styles.hex} aria-hidden="true" />
          Add upgrade
        </button>
      ))}
    </div>
  );
}
