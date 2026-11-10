import { useState } from 'react';
import { CARD_TYPES } from '@/shared/lib/card-types';
import { cx } from '@/shared/lib/cx';
import { Button } from '@/shared/ui/Button';
import { CardFace } from '@/shared/ui/CardFace';
import { CheckRow } from '@/shared/ui/CheckRow';
import { Eyebrow } from '@/shared/ui/Eyebrow';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Pill } from '@/shared/ui/Pill';
import { TypeBadge } from '@/shared/ui/TypeBadge';
import styles from './StylePage.module.css';

// Dev-only reference page: reproduces the StyleFinal artboard from the real tokens and components.

const PALETTE = [
  ['Ground', '--bg'],
  ['Panel', '--panel'],
  ['Border', '--border'],
  ['Line', '--line'],
  ['Text', '--text'],
  ['Muted', '--muted'],
  ['Accent · actions', '--accent'],
  ['Accent · text', '--accent-text'],
] as const;

/** Token values as the browser resolves them, so the page never drifts from tokens.css. */
function readTokens(): Record<string, string> {
  const root = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    PALETTE.map(([, token]) => [token, root.getPropertyValue(token).trim().toUpperCase()]),
  );
}

export function StylePage() {
  const [values] = useState(readTokens);
  const [pill, setPill] = useState(true);
  const [check, setCheck] = useState(true);

  return (
    <>
      <title>Style sheet · Bonfire Ledger</title>
      <PageHeader
        crumbs={['Compendium', 'Style sheet']}
        title="Style sheet"
        lede="Tokens, type and components as built. Dev builds only."
      />
      <div className={styles.grid}>
        <section className={styles.section}>
          <div className={styles.heading}>
            <h2 className={styles.h}>Palette · Crimson</h2>
            <Eyebrow>Only palette</Eyebrow>
          </div>
          <div className={styles.swatches}>
            {PALETTE.map(([name, token]) => (
              <div key={token} className={styles.swatch}>
                <span className={styles.chip} style={{ background: `var(${token})` }} />
                <span className={styles.swatchText}>
                  <span>{name}</span>
                  <span className={styles.mono}>{values[token]}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h}>Card shapes</h2>
          <div className={styles.shapes}>
            <Shape
              ratio="var(--ratio-treasure)"
              width={86}
              label="571 × 850"
              sub="Treasure · Event"
            />
            <Shape
              ratio="var(--ratio-enemy)"
              width={92}
              label="611 × 850"
              sub="Enemy · Boss · Behaviour"
            />
            <Shape ratio="var(--ratio-encounter)" width={76} label="7 : 12" sub="Encounter" />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h}>Fixed colours</h2>
          <Eyebrow tone="muted">Map nodes · match the rulebook</Eyebrow>
          <div className={styles.row}>
            <span className={styles.legend}>
              <span className={cx(styles.node, styles.start)} />
              Start
            </span>
            <span className={styles.legend}>
              <span className={cx(styles.node, styles.spawn)} />
              Spawn
            </span>
            <span className={styles.legend}>
              <span className={cx(styles.node, styles.terrain)} />
              Terrain
            </span>
          </div>
          <Eyebrow tone="muted">Dice</Eyebrow>
          <div className={styles.row}>
            {(
              [
                ['black', 'Black'],
                ['blue', 'Blue'],
                ['orange', 'Orange'],
              ] as const
            ).map(([die, name]) => (
              <span key={die} className={styles.legend}>
                <span className={cx(styles.die, styles[die])} />
                {name}
              </span>
            ))}
          </div>
          <Eyebrow tone="muted">Card types</Eyebrow>
          <div className={styles.badges}>
            {CARD_TYPES.map((type) => (
              <TypeBadge
                key={type}
                type={type}
                label={type === 'boss' ? 'Boss · accent' : undefined}
              />
            ))}
          </div>
        </section>

        <section className={cx(styles.section, styles.wide, styles.ruled)}>
          <h2 className={styles.h}>Type</h2>
          <div className={styles.specimen}>
            <span className={styles.display}>Rest at the bonfire</span>
            <Eyebrow tone="muted">
              Display · Cormorant Garamond Italic 600, caps · hero and page titles
            </Eyebrow>
          </div>
          <div className={styles.specimens}>
            <div className={styles.specimen}>
              <span className={styles.sectionType}>Stat progression</span>
              <Eyebrow tone="muted">Section · Cormorant 700, caps, tracked</Eyebrow>
            </div>
            <div className={styles.specimen}>
              <span className={styles.navType}>Archive</span>
              <Eyebrow tone="muted">Nav · 15px, caps, wide tracking</Eyebrow>
            </div>
            <div className={styles.specimen}>
              <Eyebrow>Compendium / Card archive</Eyebrow>
              <Eyebrow tone="muted">Eyebrow and labels · Plex Mono 11px</Eyebrow>
            </div>
          </div>
          <div className={styles.specimens}>
            <div className={cx(styles.specimen, styles.measure)}>
              <span className={styles.bodyType}>
                Rules text and descriptions in a book face.{' '}
                <em className={styles.flavour}>Flavour and helper lines in its italic.</em>
              </span>
              <Eyebrow tone="muted">Body · EB Garamond 17–21px</Eyebrow>
            </div>
            <div className={styles.specimen}>
              <span className={styles.dataType}>2.33 · 14 · TOG-002</span>
              <Eyebrow tone="muted">Data · numbers, stats, card IDs</Eyebrow>
            </div>
          </div>
        </section>

        <section className={cx(styles.section, styles.ruled)}>
          <h2 className={styles.h}>Buttons</h2>
          <div className={styles.row}>
            <Button>Primary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <Eyebrow tone="muted">Filter pill · check row</Eyebrow>
          <div className={styles.row}>
            <Pill selected={pill} onChange={setPill}>
              {pill ? 'Selected' : 'Idle'}
            </Pill>
            <Pill selected={false} onChange={() => {}}>
              Idle
            </Pill>
            <div className={styles.checkDemo}>
              <CheckRow checked={check} onChange={setCheck} label="Treasure chests" />
            </div>
          </div>
        </section>

        <section className={cx(styles.section, styles.full, styles.ruled, styles.cards)}>
          <div className={styles.cardsIntro}>
            <h2 className={styles.h}>Cards</h2>
            <p className={styles.note}>
              Every card keeps its printed proportions, with rounded corners. Type and ID sit under
              the card, never on it.
            </p>
          </div>
          <CardDemo state="rest" label="Rest" />
          <CardDemo state="hover" label="Hover · lift, tilt, glow" />
          <CardDemo state="selected" label="Selected · 2px accent ring" />
          <CardDemo state="rest" label="No scan yet" name="[Card name]" art={null} />
        </section>
      </div>
    </>
  );
}

function Shape({
  ratio,
  width,
  label,
  sub,
}: {
  ratio: string;
  width: number;
  label: string;
  sub: string;
}) {
  return (
    <div className={styles.shape}>
      <span className={styles.shapeBox} style={{ aspectRatio: ratio, width }} />
      <Eyebrow tone="muted" className={styles.center}>
        {label}
        <br />
        {sub}
      </Eyebrow>
    </div>
  );
}

function CardDemo({
  state,
  label,
  name = 'Bonewheel Shield',
  art = 'tog/treasure/bonewheel-shield.png',
}: {
  state: 'rest' | 'hover' | 'selected';
  label: string;
  name?: string;
  art?: string | null;
}) {
  return (
    <div className={styles.cardDemo}>
      <CardFace name={name} type="treasure" art={art} className={styles[state]} />
      <Eyebrow tone="muted">{label}</Eyebrow>
    </div>
  );
}
