import { useRef, useState, type KeyboardEvent } from 'react';
import { useBacks, useCard } from '@/shared/api/queries';
import type { Card, CardBack } from '@/shared/api/types';
import { backFor } from '@/shared/lib/backs';
import { CARD_TYPES, cardSets, SET_NAMES, type CardType } from '@/shared/lib/card-types';
import { imageUrl } from '@/shared/lib/card-image';
import { badge, statLine, type NameOf } from '@/shared/lib/format';
import { CardFace } from '@/shared/ui/CardFace';
import { Dialog } from '@/shared/ui/Dialog';
import { TypeBadge } from '@/shared/ui/TypeBadge';
import { flipTransform, useFlip } from './useFlip';
import styles from './CardCloseUp.module.css';

type CardCloseUpProps = {
  id: string;
  /** The card from the catalog when it's cached; otherwise it's fetched (deep links). */
  cached: Card | undefined;
  /** Display code ("TOG-012"), once the catalog is complete. */
  code: string | undefined;
  nameOf: NameOf;
  onClose: () => void;
};

/** `{set}-{type}-{slug}`: the type sizes the card box while the card loads. */
function typeOfId(id: string): CardType | undefined {
  return CARD_TYPES.find((type) => type === id.split('-')[1]);
}

/** Handoff "Card close-up": the card large, drag or flick to turn it over. Lazy chunk. */
export default function CardCloseUp({ id, cached, code, nameOf, onClose }: CardCloseUpProps) {
  const query = useCard(cached ? null : id);
  const card = cached ?? query.data;
  const backs = useBacks().data;
  const closeRef = useRef<HTMLButtonElement>(null);
  const { angle, side, cardRef, turn, handlers } = useFlip();
  // Escape, Close and a backdrop click can land together; going Back twice would leave the page.
  const closed = useRef(false);
  function close() {
    if (closed.current) return;
    closed.current = true;
    onClose();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      // Handled here rather than by the native cancel, so it also works mid-drag.
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      turn(event.key === 'ArrowRight' ? 1 : -1);
    }
  }

  const type = card?.type ?? typeOfId(id);
  const label = card ? `${card.name} close-up` : 'Card close-up';
  return (
    <Dialog open onClose={close} label={label} initialFocusRef={closeRef}>
      {/* Keys bubble from whatever has focus inside the dialog; the dialog itself is the target. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div className={styles.content} onKeyDown={onKeyDown}>
        {query.isError && !card ? (
          <p className={styles.missing}>There's no card with this ID in the archive.</p>
        ) : (
          <div className={styles.stage}>
            <div
              ref={cardRef}
              className={styles.card}
              data-type={type}
              style={{ transform: flipTransform(angle) }}
              {...(card ? handlers : {})}
            >
              <div className={styles.side}>
                {card ? (
                  <CardFace
                    name={card.name}
                    type={card.type}
                    art={card.art}
                    priority
                    alt={card.name}
                    className={styles.face}
                  />
                ) : (
                  <span className={styles.loading} aria-hidden="true" />
                )}
              </div>
              <div className={styles.side} data-back="">
                {card && <Back card={card} back={backs && backFor(card, backs)} />}
              </div>
            </div>
          </div>
        )}

        {card && (
          <div className={styles.info}>
            <h2 className={styles.name}>{card.name}</h2>
            <p className={styles.meta}>
              <TypeBadge type={card.type} {...badge(card)} />
              <span>
                {[
                  cardSets(card)
                    .map((set) => SET_NAMES[set].name)
                    .join(' · '),
                  code,
                  statLine(card, nameOf),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </p>
            <p className={styles.hint} aria-live="polite">
              Drag or flick the card to turn it over · showing the {side}
            </p>
          </div>
        )}

        <div className={styles.actions}>
          {card && (
            <button
              type="button"
              className={styles.action}
              onClick={() => {
                turn(1);
              }}
            >
              Turn over
            </button>
          )}
          <button type="button" ref={closeRef} className={styles.action} onClick={close}>
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
}

/** The deck's real back; a plain placeholder while backs load, or if there's no image. */
function Back({ card, back }: { card: Card; back: CardBack | undefined }) {
  const [failed, setFailed] = useState(false);
  const src = imageUrl(back?.art);
  if (!src || failed) {
    return (
      <span className={styles.placeholderBack}>
        <span>Card back</span>
      </span>
    );
  }
  return (
    <img
      className={styles.backImage}
      src={src}
      alt={`${card.name}, back`}
      draggable={false}
      decoding="async"
      onError={() => {
        setFailed(true);
      }}
    />
  );
}
