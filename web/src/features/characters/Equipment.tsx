import type { Treasure } from '@/shared/api/types';
import { CardFace } from '@/shared/ui/CardFace';
import { cardIn, type Gear, type GearSlot } from './builder/gear';
import styles from './Equipment.module.css';

/** Slots in canvas order: label, tag, kind. */
const SLOTS: readonly { slot: GearSlot; label: string; tag: string }[] = [
  { slot: 'armour', label: 'Armour', tag: '' },
  { slot: 'left', label: 'Left hand', tag: '' },
  { slot: 'right', label: 'Right hand', tag: 'Attack' },
  { slot: 'backup0', label: 'Backup', tag: '1 of 2' },
  { slot: 'backup1', label: 'Backup', tag: '2 of 2' },
];

type EquipmentProps = {
  /** Null until the catalog loads and the starter kit goes in. */
  gear: Gear | null;
  cardOf: (id: string) => Treasure | undefined;
  onChoose: (slot: GearSlot) => void;
  onTwoHanded: (on: boolean) => void;
};

/** Armour, both hands and two backup cards, plus the two-handed toggle. */
export function Equipment({ gear, cardOf, onChoose, onTwoHanded }: EquipmentProps) {
  const twoHanded = gear?.twoHanded ?? false;
  const right = gear?.right ? cardOf(gear.right) : undefined;
  // A two-handed card keeps the toggle on; with a one-handed one it's the player's call.
  const locked = right?.hands === 2;
  return (
    <section className={styles.section} aria-labelledby="equipment-title">
      <div className={styles.head}>
        <h2 id="equipment-title" className={styles.title}>
          Equipment
        </h2>
        <button
          type="button"
          className={styles.toggle}
          aria-pressed={twoHanded}
          disabled={!gear || locked}
          onClick={() => {
            onTwoHanded(!twoHanded);
          }}
        >
          <span className={styles.tick} aria-hidden="true" />
          Right hand is two-handed
        </button>
      </div>
      <div className={styles.slots}>
        {SLOTS.map(({ slot, label, tag }) => {
          const id = gear ? cardIn(gear, slot) : null;
          const card = id ? cardOf(id) : undefined;
          const emptied = slot === 'left' && twoHanded;
          const backup = slot === 'backup0' || slot === 'backup1';
          return (
            <div
              key={slot}
              className={styles.slot}
              data-slot={slot}
              data-emptied={emptied || undefined}
            >
              <div className={styles.label}>
                <span>{label}</span>
                <span>{slot === 'right' && twoHanded ? 'Two-handed' : tag}</span>
              </div>
              <div
                className={styles.face}
                data-kind={slot === 'right' ? 'right' : backup ? 'backup' : 'plain'}
              >
                {card && !emptied ? (
                  <CardFace name={card.name} type="treasure" art={card.art} alt={card.name} />
                ) : (
                  <span className={styles.empty}>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="6" y="3.5" width="12" height="17" rx="1.5" />
                      <path d="M12 9v6M9 12h6" />
                    </svg>
                    <span>
                      {emptied
                        ? 'Emptied by the two-handed weapon'
                        : backup
                          ? 'Carried, never equipped'
                          : 'Empty'}
                    </span>
                  </span>
                )}
              </div>
              <button
                type="button"
                className={styles.action}
                disabled={!gear || emptied}
                aria-label={`${card && !emptied ? 'Swap' : 'Choose'} card: ${label}${tag && slot !== 'right' ? ` ${tag}` : ''}`}
                onClick={() => {
                  onChoose(slot);
                }}
              >
                {card && !emptied ? 'Swap card' : 'Choose card'}
              </button>
            </div>
          );
        })}
      </div>
      <p className={styles.note}>
        A two-handed weapon empties the other hand. Backup holds two cards and they are never
        equipped; swap them in during upkeep.
      </p>
    </section>
  );
}
