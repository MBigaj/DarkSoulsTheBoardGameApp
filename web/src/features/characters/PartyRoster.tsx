import { useRef, type KeyboardEvent } from 'react';
import type { ClassDef } from '@/shared/api/types';
import { StoreImage } from '@/shared/ui/StoreImage';
import { classSets } from './classes';
import styles from './PartyRoster.module.css';

const ROMAN = ['I', 'II', 'III', 'IV'];

type PartyRosterProps = {
  active: number;
  classes: readonly ClassDef[];
  /** Each slot's class, in slot order. */
  slotClasses: readonly ClassDef[];
  onSelectSlot: (slot: number) => void;
  onPickClass: (classId: string) => void;
  /** id of the panel the slot tabs control (class card and stats). */
  panelId: string;
};

/** Party: four slot tabs (arrow keys move and select) and the class picker for the selected slot. */
export function PartyRoster({
  active,
  classes,
  slotClasses,
  onSelectSlot,
  onPickClass,
  panelId,
}: PartyRosterProps) {
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeClass = slotClasses[active];

  function onKeyDown(event: KeyboardEvent, index: number) {
    const last = slotClasses.length - 1;
    const next = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    // Selecting a slot is cheap, so the focused tab is selected too (automatic activation).
    onSelectSlot(next);
    tabs.current[next]?.focus();
  }

  return (
    <section className={styles.party} aria-label="Party">
      <div className={styles.head}>
        <span>Party roster · 4 slots</span>
        <span>Select a slot, then choose its class</span>
      </div>
      <div role="tablist" aria-label="Party slots" className={styles.slots}>
        {slotClasses.map((cls, i) => {
          const selected = i === active;
          return (
            <button
              key={i}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`party-slot-${String(i)}`}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              className={styles.slot}
              onClick={() => {
                onSelectSlot(i);
              }}
              onKeyDown={(event) => {
                onKeyDown(event, i);
              }}
            >
              <span className={styles.thumb} aria-hidden="true">
                {cls.art && (
                  <StoreImage art={cls.art} width={1000} height={800} className={styles.portrait} />
                )}
              </span>
              <span className={styles.slotText}>
                <span className={styles.slotName}>{cls.name}</span>
                <span className="visually-hidden">, </span>
                <span className={styles.slotMeta}>
                  Slot {ROMAN[i]} · {classSets(cls, 'short')}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div
        role="group"
        aria-label={`Class for slot ${ROMAN[active] ?? ''}`}
        className={styles.picker}
      >
        <span className={styles.pickerLabel}>Class for slot {ROMAN[active]}</span>
        {classes.map((cls) => (
          <button
            key={cls._id}
            type="button"
            aria-pressed={cls._id === activeClass?._id}
            className={styles.classPill}
            onClick={() => {
              onPickClass(cls._id);
            }}
          >
            {cls.name}
            {/* Name and set tag sit flush: the hidden comma keeps them two words when read out. */}
            <span className="visually-hidden">, </span>
            <span className={styles.classSets}>{classSets(cls, 'short')}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
