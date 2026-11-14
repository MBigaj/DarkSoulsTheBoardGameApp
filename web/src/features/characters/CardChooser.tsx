import { useMemo, useRef, useState } from 'react';
import { CardZoom } from './CardZoom';
import type { Treasure } from '@/shared/api/types';
import { CardFace } from '@/shared/ui/CardFace';
import { CheckRow } from '@/shared/ui/CheckRow';
import { Dialog } from '@/shared/ui/Dialog';
import { fitsHost, slotAccepts, upgradeCost, type GearSlot } from './builder/gear';
import styles from './CardChooser.module.css';

const SLOT_NAMES: Record<GearSlot, string> = {
  armour: 'armour',
  left: 'left hand',
  right: 'right hand',
  backup0: 'backup 1',
  backup1: 'backup 2',
};

/** What's being chosen: a card for a gear slot, or an upgrade for a card in the gear. */
export type ChooserMode =
  | { kind: 'slot'; slot: GearSlot; /** The card in the slot now. */ current: string | null }
  | {
      kind: 'upgrade';
      host: Treasure;
      /** Upgrade slots the host has free. */
      free: number;
      /** Upgrades already on the host. */
      attached: readonly string[];
    };

type CardChooserProps = {
  mode: ChooserMode;
  classId: string;
  className: string;
  treasure: readonly Treasure[];
  onPick: (card: Treasure | null) => void;
  onClose: () => void;
};

/**
 * Slot mode: treasure valid for the slot (`equip`, `hands`). Upgrade mode: upgrades that fit the
 * card (weapon → hand cards, armour → armour); one needing more slots than are free is shown but
 * can't be picked. Both: generic cards and the class's own, or every class with "Show all classes".
 */
export function CardChooser({
  mode,
  classId,
  className,
  treasure,
  onPick,
  onClose,
}: CardChooserProps) {
  const [query, setQuery] = useState('');
  // On by default (owner, 14 Nov): every class's cards; untick for generic + this class's own.
  const [allClasses, setAllClasses] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);
  /** The card shown large, by id; null = the grid. */
  const [zoomed, setZoomed] = useState<string | null>(null);

  const cards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return treasure
      .filter(
        (card) =>
          (mode.kind === 'slot' ? slotAccepts(mode.slot, card) : fitsHost(mode.host, card)) &&
          (allClasses || card.class === undefined || card.class === classId) &&
          card.name.toLowerCase().includes(q),
      )
      .toSorted((a, b) => a.name.localeCompare(b.name));
  }, [treasure, mode, classId, allClasses, query]);

  const title =
    mode.kind === 'slot'
      ? `Choose ${SLOT_NAMES[mode.slot]} for ${className}`
      : `Choose upgrade for ${mode.host.name}`;
  const isCurrent = (card: Treasure) =>
    mode.kind === 'slot' ? card._id === mode.current : mode.attached.includes(card._id);
  /** Upgrade mode: why a card can't be picked, if it can't. */
  const blocked = (card: Treasure) =>
    mode.kind === 'upgrade' && !isCurrent(card) && upgradeCost(card) > mode.free
      ? `Needs ${String(upgradeCost(card))} slots`
      : undefined;
  const zoomIndex = zoomed === null ? -1 : cards.findIndex((card) => card._id === zoomed);
  const zoomCard = cards[zoomIndex];

  /** Back to the grid, with focus on the zoom button of the card last shown. */
  function closeZoom() {
    const id = zoomed;
    setZoomed(null);
    requestAnimationFrame(() => {
      if (id) document.querySelector<HTMLElement>(`[data-zoom="${CSS.escape(id)}"]`)?.focus();
    });
  }

  return (
    <Dialog open onClose={onClose} label={title} initialFocusRef={searchRef}>
      <div className={styles.panel} data-zoomed={zoomCard ? '' : undefined}>
        {zoomCard && (
          <CardZoom
            card={zoomCard}
            count={cards.length}
            index={zoomIndex}
            pickLabel={`${mode.kind === 'slot' ? 'Choose' : 'Add'} ${zoomCard.name}`}
            blocked={blocked(zoomCard)}
            onPick={() => {
              onPick(zoomCard);
            }}
            onStep={(to) => {
              setZoomed(cards[to]?._id ?? null);
            }}
            onBack={closeZoom}
          />
        )}
        {/* The list stays mounted under the zoomed card (scroll and search kept), but inert. */}
        <div className={styles.list} inert={zoomCard !== undefined}>
          <div className={styles.head}>
            <h2 className={styles.title}>{title}</h2>
            <button type="button" className={styles.close} onClick={onClose}>
              Close
            </button>
          </div>
          {mode.kind === 'upgrade' && (
            <div className={styles.target}>
              <CardFace
                name={mode.host.name}
                type="treasure"
                art={mode.host.art}
                className={styles.targetFace}
              />
              <div>
                <div className={styles.targetMeta}>
                  For {mode.host.equip === 'armour' ? 'armour' : 'a weapon'} · {mode.free}{' '}
                  {mode.free === 1 ? 'slot' : 'slots'} free
                </div>
                <div>{mode.host.name}</div>
              </div>
            </div>
          )}
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
            {cards.map((card) => {
              const reason = blocked(card);
              const current = isCurrent(card);
              return (
                <li key={card._id} className={styles.cell}>
                  <button
                    type="button"
                    className={styles.card}
                    aria-pressed={current}
                    disabled={reason !== undefined}
                    onClick={() => {
                      onPick(card);
                    }}
                  >
                    <CardFace name={card.name} type="treasure" art={card.art} />
                    <span className={styles.name}>{card.name}</span>
                    {mode.kind === 'upgrade' && (
                      <span className={styles.note} data-blocked={reason ? '' : undefined}>
                        {reason ??
                          (current
                            ? 'On this card'
                            : `${String(upgradeCost(card))} slot${upgradeCost(card) > 1 ? 's' : ''}`)}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className={styles.zoomButton}
                    data-zoom={card._id}
                    aria-label={`Zoom in on ${card.name}`}
                    onClick={() => {
                      setZoomed(card._id);
                    }}
                  >
                    <span className={styles.zoomIcon} aria-hidden="true">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <circle cx="10.5" cy="10.5" r="6.5" />
                        <path d="M15.5 15.5 21 21M10.5 7.5v6M7.5 10.5h6" />
                      </svg>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {cards.length === 0 && <p className={styles.none}>No card fits this slot and search.</p>}
          {mode.kind === 'slot' && (
            <div className={styles.foot}>
              <button
                type="button"
                className={styles.close}
                disabled={mode.current === null}
                onClick={() => {
                  onPick(null);
                }}
              >
                Empty this slot
              </button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
