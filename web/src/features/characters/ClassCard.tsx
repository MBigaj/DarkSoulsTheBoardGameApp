import type { ClassDef } from '@/shared/api/types';
import { Eyebrow } from '@/shared/ui/Eyebrow';
import { Frame } from '@/shared/ui/Frame';
import { StoreImage } from '@/shared/ui/StoreImage';
import { classSets } from './classes';
import styles from './ClassCard.module.css';

const ENDURANCE = 10;

type ClassCardProps = {
  cls: ClassDef;
  souls: number;
  /** Stamina on the endurance bar, filled from the left (the calculator sets it, FE-17). */
  stamina: number;
};

/** The selected slot's class: board image, name, souls spent, heroic ability, facts, endurance. */
export function ClassCard({ cls, souls, stamina }: ClassCardProps) {
  const setsLong = classSets(cls, 'name');
  const facts = [
    ['Core set', setsLong],
    ['Heroic ability', cls.heroicAbility.name],
    ['Taunt', String(cls.taunt)],
  ] as const;
  return (
    <Frame as="section" aria-label="Class" className={styles.card}>
      <figure className={styles.board}>
        <div className={styles.boardBox}>
          {cls.art && (
            <StoreImage
              art={cls.art}
              alt={`${cls.name} class board`}
              width={1000}
              height={800}
              priority
              className={styles.boardImage}
            />
          )}
        </div>
        <figcaption className={styles.caption}>
          Class board · taunt, heroic ability, stat tracks
        </figcaption>
      </figure>

      <div className={styles.info}>
        <div className={styles.top}>
          <div className={styles.title}>
            <Eyebrow>Class · {setsLong}</Eyebrow>
            <h2 className={styles.name}>{cls.name}</h2>
          </div>
          <div className={styles.souls}>
            <span className={styles.label}>Souls spent</span>
            <span className={styles.soulsValue}>{souls}</span>
          </div>
        </div>
        <p className={styles.blurb}>
          {cls.heroicAbility.name}: {cls.heroicAbility.text}
        </p>
        <dl className={styles.facts}>
          {facts.map(([term, value]) => (
            <div key={term} className={styles.fact}>
              <dt className={styles.label}>{term}</dt>
              <dd className={styles.factValue}>{value}</dd>
            </div>
          ))}
        </dl>
        <div className={styles.endurance}>
          <div className={styles.enduranceHead}>
            <span>Endurance bar · stamina in from the left</span>
            <span className={styles.enduranceCount}>
              {stamina} / {ENDURANCE}
            </span>
          </div>
          <div className={styles.bar} aria-hidden="true">
            {Array.from({ length: ENDURANCE }, (_, i) => (
              <span key={i} className={styles.square} data-filled={i < stamina || undefined} />
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}
