import { useRef } from 'react';
import type { Treasure } from '@/shared/api/types';
import { statLine } from '@/shared/lib/format';
import { CardFace } from '@/shared/ui/CardFace';
import { Dialog } from '@/shared/ui/Dialog';
import { upgradeCost } from './builder/gear';
import styles from './UpgradeDetails.module.css';

type UpgradeDetailsProps = {
  upgrade: Treasure;
  host: Treasure;
  onRemove: () => void;
  onClose: () => void;
};

/** What an upgrade is and does: its card, what it fits, the slots it takes, its rules text. */
export function UpgradeDetails({ upgrade, host, onRemove, onClose }: UpgradeDetailsProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const cost = upgradeCost(upgrade);
  const target = upgrade.upgradeTarget === 'armour' ? 'Armour upgrade' : 'Weapon upgrade';
  return (
    <Dialog open onClose={onClose} label={`${upgrade.name}, upgrade`} initialFocusRef={closeRef}>
      <div className={styles.panel}>
        <CardFace
          name={upgrade.name}
          type="treasure"
          art={upgrade.art}
          alt={upgrade.name}
          className={styles.face}
        />
        <div className={styles.info}>
          <span className={styles.meta}>
            {target} · takes {cost} {cost === 1 ? 'slot' : 'slots'}
          </span>
          <h2 className={styles.name}>{upgrade.name}</h2>
          <span className={styles.meta}>On {host.name}</span>
          {upgrade.abilities.map((ability, i) => (
            <p key={i} className={styles.text}>
              {ability.text}
            </p>
          ))}
          <span className={styles.meta}>
            {Object.values(upgrade.requirements).some((n) => n > 0)
              ? `Requires ${statLine(upgrade)}`
              : statLine(upgrade)}
          </span>
          <div className={styles.actions}>
            <button type="button" className={styles.action} onClick={onRemove}>
              Remove from {host.name}
            </button>
            <button type="button" ref={closeRef} className={styles.action} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
