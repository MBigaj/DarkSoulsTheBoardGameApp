import { useMemo, useRef, useState } from 'react';
import type { Treasure } from '@/shared/api/types';
import { CardFace } from '@/shared/ui/CardFace';
import { CheckRow } from '@/shared/ui/CheckRow';
import { Dialog } from '@/shared/ui/Dialog';
import { slotAccepts, type GearSlot } from './builder/gear';
import styles from './CardChooser.module.css';

const SLOT_NAMES: Record<GearSlot, string> = {
  armour: 'armour',
  left: 'left hand',
  right: 'right hand',
  backup0: 'backup 1',
  backup1: 'backup 2',
};

type CardChooserProps = {
  slot: GearSlot;
  classId: string;
  className: string;
  treasure: readonly Treasure[];
  /** The card in the slot now, if any. */
  current: string | null;
  onPick: (card: Treasure | null) => void;
  onClose: () => void;
};

/**
 * Treasure valid for the slot (`equip`, `hands`): generic cards and the class's own, or every class
 * with "Show all classes". Upgrades and consumables never appear.
 */
export function CardChooser({
  slot,
  classId,
  className,
  treasure,
  current,
  onPick,
  onClose,
}: CardChooserProps) {
  const [query, setQuery] = useState('');
  const [allClasses, setAllClasses] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const cards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return treasure
      .filter(
        (card) =>
          slotAccepts(slot, card) &&
          (allClasses || card.class === undefined || card.class === classId) &&
          card.name.toLowerCase().includes(q),
      )
      .toSorted((a, b) => a.name.localeCompare(b.name));
  }, [treasure, slot, classId, allClasses, query]);

  const title = `Choose ${SLOT_NAMES[slot]} for ${className}`;
  return (
    <Dialog open onClose={onClose} label={title} initialFocusRef={searchRef}>
      <div className={styles.panel}>
        <div className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose}>
            Close
          </button>
        </div>
        <div className={styles.controls}>
          <input
            ref={searchRef}
            type="search"
            className={styles.search}
            placeholder="Search by name"
            aria-label="Search cards by name"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
          <CheckRow
            checked={allClasses}
            onChange={setAllClasses}
            label="Show all classes"
            className={styles.allClasses}
          />
          <span className={styles.count} aria-live="polite">
            {cards.length} {cards.length === 1 ? 'card' : 'cards'}
          </span>
        </div>
        <ul className={styles.grid}>
          {cards.map((card) => (
            <li key={card._id}>
              <button
                type="button"
                className={styles.card}
                aria-pressed={card._id === current}
                onClick={() => {
                  onPick(card);
                }}
              >
                <CardFace name={card.name} type="treasure" art={card.art} />
                <span className={styles.name}>{card.name}</span>
              </button>
            </li>
          ))}
        </ul>
        {cards.length === 0 && <p className={styles.none}>No card fits this slot and search.</p>}
        <div className={styles.foot}>
          <button
            type="button"
            className={styles.close}
            disabled={current === null}
            onClick={() => {
              onPick(null);
            }}
          >
            Empty this slot
          </button>
        </div>
      </div>
    </Dialog>
  );
}
