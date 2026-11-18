import { useId, type ReactNode } from 'react';
import type { Attack, DiceTable, Treasure } from '@/shared/api/types';
import { DICE, type Die } from '@/shared/lib/card-types';
import { attackSummary, killChance } from '@/shared/lib/dice';
import { CheckRow } from '@/shared/ui/CheckRow';
import { Frame } from '@/shared/ui/Frame';
import { DiceIcon } from '@/shared/ui/icons';
import { attackInputs, LIMITS, type Calc, type CalcInputs, type Hand } from './builder/calculator';
import {
  bonusText,
  CONDITION_LABEL,
  contributions,
  dieBonus,
  type BonusLine,
  type TickCondition,
} from './builder/upgradeBonus';
import styles from './DamageCalculator.module.css';
import { HealthSlider } from './HealthSlider';

const DIE_NAMES: Record<Die, string> = {
  black: 'Black die',
  blue: 'Blue die',
  orange: 'Orange die',
};

const HAND_NAMES: Record<Hand, string> = { right: 'Right hand', left: 'Left hand' };

/** Everything the page works out for the calculator (see BuilderPage). */
export type CalculatorView = {
  /** Equipped hands whose card has attacks, right first. */
  weapons: readonly { hand: Hand; card: Treasure }[];
  /** The chosen hand's card (null: empty hand). */
  weapon: Treasure | null;
  /** What it shows now (see `currentCalc`); `inputs` = the card's values. */
  calc: Calc;
  /** Upgrade effects on this weapon and from armour upgrades, applying or not. */
  lines: readonly BonusLine[];
  /** Upgrades on the weapon that change no number (Blood Gem…). */
  noEffect: readonly Treasure[];
  /** `calc.inputs` plus the applying lines: what's rolled. */
  effective: CalcInputs;
};

type DamageCalculatorProps = {
  /** Null until dice.json loads: the panel holds its place (no layout shift) and fills in. */
  dice: DiceTable | null;
  /** Null with `dice`, or until the gear loads. */
  view: CalculatorView | null;
  onChange: (calc: Calc) => void;
  onWeapon: (hand: Hand) => void;
  /** Ticks for conditional upgrades: "target is a boss" (party), "4+ damage" (this character). */
  conditions: Record<TickCondition, boolean>;
  onCondition: (condition: TickCondition, on: boolean) => void;
  /** The enemy's health for "Chance to kill" (party-wide). */
  health: number;
  onHealth: (health: number) => void;
};

const signed = (n: number) => (n > 0 ? `+${String(n)}` : String(n));

/** 0.3% reads "<1%" and 99.7% reads ">99%", so a rounded 0 or 100 always means never or always. */
function percent(p: number): string {
  if (p > 0 && p < 0.005) return '<1%';
  if (p < 1 && p > 0.995) return '>99%';
  return `${String(Math.round(p * 100))}%`;
}

/** Lines grouped by their upgrade card, in order: one list item per upgrade. */
function byUpgrade(lines: readonly BonusLine[]) {
  const groups: { upgrade: Treasure; effects: BonusLine[] }[] = [];
  for (const line of lines) {
    const last = groups.at(-1);
    if (last?.upgrade._id === line.upgrade._id) last.effects.push(line);
    else groups.push({ upgrade: line.upgrade, effects: [line] });
  }
  return groups;
}

/** An input's upgrade note, or null when no upgrade changes it. */
function bonusFor(parts: { name: string; amount: number }[], total: string) {
  return parts.length > 0 ? { from: fromUpgrades(parts), total } : null;
}

/**
 * An attack option as icons: a green stamina node with its cost, a die swatch per colour with its
 * count, the modifier, a yellow orb for magic. Screen readers get words instead
 * ("4 stamina, 2 black, 1 blue, +1 damage, magic").
 */
function OptionSummary({ attack }: { attack: Attack }) {
  const dice = DICE.filter((die) => (attack.dice[die] ?? 0) > 0);
  const parts: { key: string; icon?: string; text?: string; spoken: string }[] = [
    { key: 'stamina', icon: 'stamina', text: String(attack.staminaCost), spoken: ' stamina' },
    ...(dice.length === 0 ? [{ key: 'none', text: 'no dice', spoken: '' }] : []),
    ...dice.map((die) => ({
      key: die,
      icon: die,
      text: String(attack.dice[die]),
      spoken: ` ${die}`,
    })),
    ...(attack.damageModifier
      ? [
          {
            key: 'modifier',
            text: signed(attack.damageModifier).replace('-', '−'),
            spoken: ' damage',
          },
        ]
      : []),
    ...(attack.damageType === 'magical' ? [{ key: 'magic', icon: 'magic', spoken: 'magic' }] : []),
    ...(attack.ignoresBlock ? [{ key: 'ignores', text: 'ignores block', spoken: '' }] : []),
  ];
  return (
    <span className={styles.choiceSub}>
      {parts.map(({ key, icon, text, spoken }, index) => (
        <span key={key} className={styles.part}>
          {index > 0 && <span className="visually-hidden">, </span>}
          {icon && <span className={styles.icon} data-icon={icon} aria-hidden="true" />}
          {text}
          {spoken && <span className="visually-hidden">{spoken}</span>}
        </span>
      ))}
    </span>
  );
}

/**
 * Damage calculator (CharactersFinal aside, owner 18 Nov): a weapon from the equipped hands, its
 * attack options, dice pool, modifier and stamina in, plus its upgrades' effects named line by line;
 * raw damage (lowest, average, max) and the chance to kill out. Maths: dice.ts.
 */
export function DamageCalculator({ dice, view, ...rest }: DamageCalculatorProps) {
  const headingId = useId();
  const head = (
    <div className={styles.head}>
      <div className={styles.headTitle}>
        <span className={styles.icon}>
          <DiceIcon />
        </span>
        <h2 id={headingId} className={styles.title}>
          Damage calculator
        </h2>
      </div>
    </div>
  );
  if (!dice || !view) {
    return (
      <Frame as="aside" aria-labelledby={headingId} aria-busy="true" className={styles.panel}>
        {head}
      </Frame>
    );
  }
  return <Calculator {...rest} dice={dice} view={view} headingId={headingId} head={head} />;
}

type CalculatorProps = Omit<DamageCalculatorProps, 'dice' | 'view'> & {
  dice: DiceTable;
  view: CalculatorView;
  headingId: string;
  head: ReactNode;
};

/** "+1 Heavy Gem · +1 Sharp Gem" */
const fromUpgrades = (parts: { name: string; amount: number }[]) =>
  parts.map(({ name, amount }) => `${signed(amount).replace('-', '−')} ${name}`).join(' · ');

function Calculator({
  dice,
  view,
  onChange,
  onWeapon,
  conditions,
  onCondition,
  health,
  onHealth,
  headingId,
  head,
}: CalculatorProps) {
  const { weapons, weapon, calc, lines, noEffect, effective } = view;
  const { inputs } = calc;
  const attacks = weapon?.attacks ?? [];
  const summary = attackSummary(effective.dice, dice, effective.modifier);
  const kill = killChance(effective.dice, dice, effective.modifier, health);
  const boosted = lines.some((line) => line.applies);

  // Editing any value leaves the loaded option.
  const edit = (change: Partial<CalcInputs>) => {
    onChange({ ...calc, option: null, inputs: { ...inputs, ...change } });
  };

  const rows: {
    key: string;
    name: string;
    sub: string;
    value: number;
    shown: string;
    min: number;
    max: number;
    set: (n: number) => void;
    swatch: string;
    /** Upgrades adding to this value, and what's rolled or paid in the end. */
    bonus: { from: string; total: string } | null;
  }[] = [
    ...DICE.map((die) => ({
      key: die,
      name: DIE_NAMES[die],
      sub: `Avg ${attackSummary({ [die]: 1 }, dice, 0).average.toFixed(2)} damage per die`,
      value: inputs.dice[die],
      shown: String(inputs.dice[die]),
      ...LIMITS.dice,
      set: (n: number) => {
        edit({ dice: { ...inputs.dice, [die]: n } });
      },
      swatch: die,
      bonus: bonusFor(contributions(lines, dieBonus(die)), `rolls ${String(effective.dice[die])}`),
    })),
    {
      key: 'modifier',
      name: 'Flat modifier',
      sub: 'Bonuses from cards and effects',
      value: inputs.modifier,
      shown: signed(inputs.modifier),
      ...LIMITS.modifier,
      set: (n: number) => {
        edit({ modifier: n });
      },
      swatch: 'modifier',
      bonus: bonusFor(
        contributions(lines, (b) => b.damage ?? 0),
        `total ${signed(effective.modifier)}`,
      ),
    },
    {
      key: 'stamina',
      name: 'Stamina cost',
      sub: 'Fills the endurance bar from the left',
      value: inputs.stamina,
      shown: String(inputs.stamina),
      ...LIMITS.stamina,
      set: (n: number) => {
        edit({ stamina: n });
      },
      swatch: 'stamina',
      bonus: bonusFor(
        contributions(lines, (b) => b.stamina ?? 0),
        `total ${String(effective.stamina)}`,
      ),
    },
  ];

  return (
    <Frame as="aside" aria-labelledby={headingId} className={styles.panel}>
      {head}

      <div className={styles.group}>
        <span className={styles.label} id={`${headingId}-weapon`}>
          Weapon
        </span>
        {weapons.length > 0 ? (
          <div role="group" aria-labelledby={`${headingId}-weapon`} className={styles.choices}>
            {weapons.map(({ hand, card }) => (
              <button
                key={hand}
                type="button"
                className={styles.choice}
                aria-pressed={calc.weapon === hand}
                onClick={() => {
                  if (calc.weapon !== hand) onWeapon(hand);
                }}
              >
                <span className={styles.choiceName}>
                  {card.name}
                  <span className="visually-hidden">, </span>
                </span>
                <span className={styles.choiceSub}>{HAND_NAMES[hand]}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.note}>No equipped card attacks.</p>
        )}
      </div>

      <div className={styles.group}>
        <span className={styles.label} id={`${headingId}-options`}>
          {weapon ? `${weapon.name} · attack options` : 'Attack options'}
        </span>
        {attacks.length > 0 ? (
          <div role="group" aria-labelledby={`${headingId}-options`} className={styles.choices}>
            {attacks.map((attack, index) => (
              <button
                // Options have no id; their order is the card's and never changes.
                key={index}
                type="button"
                className={styles.choice}
                aria-pressed={calc.option === index}
                onClick={() => {
                  onChange({ ...calc, option: index, inputs: attackInputs(attack) });
                }}
              >
                <span className={styles.choiceName}>
                  Attack {index + 1}
                  {/* Keeps "Attack 1" and the summary apart for screen readers. */}
                  <span className="visually-hidden">, </span>
                </span>
                <OptionSummary attack={attack} />
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.note}>
            {weapon ? `${weapon.name} has no attack options.` : 'Nothing to attack with.'} Set a
            pool by hand below.
          </p>
        )}
      </div>

      {(lines.length > 0 || noEffect.length > 0) && (
        <div className={styles.group}>
          <span className={styles.label}>Upgrades</span>
          <ul className={styles.upgrades}>
            {byUpgrade(lines).map(({ upgrade, effects }) => (
              <li
                key={upgrade._id}
                className={styles.upgrade}
                data-applies={effects.some((line) => line.applies) || undefined}
              >
                <span className={styles.hex} aria-hidden="true" />
                <span className={styles.upgradeText}>
                  <span className={styles.upgradeName}>
                    {upgrade.name}
                    {upgrade.upgradeTarget === 'armour' && (
                      <span className={styles.upgradeWhere}> · armour</span>
                    )}
                  </span>
                  {effects.map((line, index) => (
                    <span
                      // An upgrade can print two effects (Demon Titanite); their order is the card's.
                      key={index}
                      className={styles.effect}
                      data-applies={line.applies || undefined}
                    >
                      <span className={styles.upgradeEffect}>
                        {bonusText(line.bonus)}
                        {!line.applies && !line.tick && (
                          <span className="visually-hidden"> (not applied)</span>
                        )}
                      </span>
                      {line.tick ? (
                        <CheckRow
                          size="lg"
                          className={styles.condition}
                          checked={conditions[line.tick]}
                          label={CONDITION_LABEL[line.tick]}
                          onChange={(on) => {
                            onCondition(line.tick as TickCondition, on);
                          }}
                        />
                      ) : (
                        line.note && <span className={styles.upgradeNote}>{line.note}</span>
                      )}
                    </span>
                  ))}
                </span>
              </li>
            ))}
            {noEffect.map((upgrade) => (
              <li key={upgrade._id} className={styles.upgrade}>
                <span className={styles.hex} aria-hidden="true" />
                <span className={styles.upgradeText}>
                  <span className={styles.upgradeName}>{upgrade.name}</span>
                  <span className={styles.upgradeNote}>No change to raw damage</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.group}>
        <span className={styles.label}>Attack dice pool</span>
        {rows.map((row) => (
          <div key={row.key} role="group" aria-label={row.name} className={styles.row}>
            <span className={styles.swatch} data-swatch={row.swatch} aria-hidden="true">
              {row.swatch === 'modifier' ? '±' : ''}
            </span>
            <span className={styles.rowText}>
              <span className={styles.rowName}>{row.name}</span>
              <span className={styles.rowSub}>{row.sub}</span>
              {row.bonus && (
                <span className={styles.rowBonus}>
                  {row.bonus.from} · {row.bonus.total}
                </span>
              )}
            </span>
            <button
              type="button"
              className={styles.step}
              aria-label={`Decrease ${row.name}`}
              disabled={row.value <= row.min}
              onClick={() => {
                row.set(row.value - 1);
              }}
            >
              −
            </button>
            <output className={styles.count} data-set={row.value !== 0 || undefined}>
              {row.shown}
            </output>
            <button
              type="button"
              className={styles.step}
              aria-label={`Increase ${row.name}`}
              disabled={row.value >= row.max}
              onClick={() => {
                row.set(row.value + 1);
              }}
            >
              +
            </button>
          </div>
        ))}
      </div>

      <div className={styles.group}>
        <span className={styles.label} id={`${headingId}-damage`}>
          Raw damage per attack{boosted ? ' · with upgrades' : ''}
        </span>
        <dl className={styles.totals} aria-labelledby={`${headingId}-damage`}>
          <div className={styles.total}>
            <dt>Lowest</dt>
            <dd>{summary.min}</dd>
          </div>
          <div className={styles.total}>
            <dt>Average</dt>
            <dd className={styles.accent}>{summary.average.toFixed(2)}</dd>
          </div>
          <div className={styles.total}>
            <dt>Max</dt>
            <dd>{summary.max}</dd>
          </div>
        </dl>
      </div>
      <div className={styles.group}>
        <HealthSlider value={health} {...LIMITS.health} onChange={onHealth} />
        <div className={styles.kill}>
          <span className={styles.label}>Chance to kill · one attack</span>
          <output className={styles.killValue}>{percent(kill)}</output>
        </div>
      </div>
    </Frame>
  );
}
