import { useEffect, useRef, type KeyboardEvent } from 'react';
import type { Treasure } from '@/shared/api/types';
import { CardFace } from '@/shared/ui/CardFace';
import { cardFacts, cardKind } from './cardFacts';
import styles from './CardZoom.module.css';

type CardZoomProps = {
  card: Treasure;
  /** Cards in the chooser's list now, for ← / →. */
  count: number;
  index: number;
  /** "Choose Claymore" / "Add Titanite Shard"; null when the card can't be picked, with the reason. */
  pickLabel: string;
  blocked: string | undefined;
  onPick: () => void;
  onStep: (to: number) => void;
  onBack: () => void;
};

/**
 * One chooser card shown large (owner, 14 Nov): the card, what it fits, its numbers in words and
 * rules text. ← / → step through the list; Esc and Back return to the grid.
 */
export function CardZoom({
  card,
  count,
  index,
  pickLabel,
  blocked,
  onPick,
  onStep,
  onBack,
}: CardZoomProps) {
  const backRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    backRef.current?.focus();
  }, []);

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      // Back to the grid, not out of the chooser.
      event.preventDefault();
      event.stopPropagation();
      onBack();
    } else if (event.key === 'ArrowRight' && index < count - 1) {
      event.preventDefault();
      onStep(index + 1);
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      onStep(index - 1);
    }
  }

  return (
    // Keys bubble here from whichever control inside has focus.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className={styles.zoom} onKeyDown={onKeyDown}>
      <div className={styles.nav}>
        <button type="button" ref={backRef} className={styles.back} onClick={onBack}>
          ← Back to {count} {count === 1 ? 'card' : 'cards'}
        </button>
        <span className={styles.position} aria-live="polite">
          {index + 1} of {count} · ← / → to step
        </span>
      </div>
      <div className={styles.body}>
        <CardFace
          name={card.name}
          type="treasure"
          art={card.art}
          alt={card.name}
          priority
          className={styles.face}
        />
        <div className={styles.info}>
          <span className={styles.kind}>{cardKind(card)}</span>
          <h3 className={styles.name}>{card.name}</h3>
          <dl className={styles.facts}>
            {cardFacts(card).map((fact) => (
              <div key={fact.label} className={styles.fact}>
                <dt className={styles.label}>{fact.label}</dt>
                {fact.lines.map((line) => (
                  <dd key={line} className={styles.value}>
                    {line}
                  </dd>
                ))}
              </div>
            ))}
          </dl>
          {card.abilities.map((ability, i) => (
            <p key={i} className={styles.text}>
              {ability.text}
            </p>
          ))}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.pick}
              disabled={blocked !== undefined}
              onClick={onPick}
            >
              {blocked ?? pickLabel}
            </button>
            <button type="button" className={styles.secondary} onClick={onBack}>
              Back
            </button>
            <span className={styles.steps}>
              <button
                type="button"
                className={styles.secondary}
                aria-label="Previous card"
                disabled={index === 0}
                onClick={() => {
                  onStep(index - 1);
                }}
              >
                ←
              </button>
              <button
                type="button"
                className={styles.secondary}
                aria-label="Next card"
                disabled={index >= count - 1}
                onClick={() => {
                  onStep(index + 1);
                }}
              >
                →
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
