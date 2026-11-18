/**
 * Upgrade effects on the damage calculator, from the cards' `attackBonus` data. Each effect becomes
 * one explicit line (which upgrade, what it adds, whether it applies and why), and the calculator
 * adds the applying lines on top of the card's values. Pure.
 */
import type { AttackBonus, BonusCondition, DiceCounts, Treasure } from '@/shared/api/types';
import { DICE } from '@/shared/lib/card-types';
import type { CalcInputs } from './calculator';

/** What the player has ticked, plus which attack option is loaded. */
export type BonusContext = {
  /** The loaded option is the weapon's highest-stamina attack (false once a value was edited). */
  highestStamina: boolean;
  vsBoss: boolean;
  heavilyDamaged: boolean;
};

/** Conditions the player ticks; `bossTreasure` comes from the weapon's data instead. */
export type TickCondition = Exclude<BonusCondition, 'bossTreasure'>;

export type BonusLine = {
  /** The upgrade card the effect is printed on. */
  upgrade: Treasure;
  bonus: AttackBonus;
  applies: boolean;
  /** Why it doesn't apply, or what it depends on ("Target is a boss"). */
  note: string | null;
  /** A condition the player can tick for this line. */
  tick: TickCondition | null;
};

export const CONDITION_LABEL: Record<TickCondition, string> = {
  vsBoss: 'Target is a boss',
  heavilyDamaged: '4+ damage on this character',
};

/**
 * Lines for one weapon: its own upgrades, then the character's armour upgrades (they boost every
 * attack). Upgrades with no `attackBonus` change no number and give no line.
 */
export function bonusLines(
  weapon: Treasure,
  weaponUpgrades: readonly Treasure[],
  armourUpgrades: readonly Treasure[],
  ctx: BonusContext,
): BonusLine[] {
  return [...weaponUpgrades, ...armourUpgrades].flatMap((upgrade) =>
    (upgrade.attackBonus ?? []).map((bonus) => line(weapon, upgrade, bonus, ctx)),
  );
}

function line(
  weapon: Treasure,
  upgrade: Treasure,
  bonus: AttackBonus,
  ctx: BonusContext,
): BonusLine {
  const tick =
    bonus.condition === 'vsBoss' || bonus.condition === 'heavilyDamaged' ? bonus.condition : null;
  // Every reason it can't apply, first one wins.
  if (bonus.attacks === 'highestStamina' && !ctx.highestStamina) {
    return { upgrade, bonus, applies: false, note: 'Highest-stamina attack only', tick };
  }
  if (bonus.condition === 'bossTreasure') {
    const boss = weapon.deck === 'boss';
    return {
      upgrade,
      bonus,
      applies: boss,
      note: boss ? `${weapon.name} is a boss treasure` : `Only on boss treasure`,
      tick: null,
    };
  }
  if (tick) return { upgrade, bonus, applies: ctx[tick], note: CONDITION_LABEL[tick], tick };
  return {
    upgrade,
    bonus,
    applies: true,
    note: bonus.attacks === 'highestStamina' ? 'Highest-stamina attack' : null,
    tick: null,
  };
}

/** The card's values plus every applying line. Stamina never goes below 0. */
export function withBonuses(inputs: CalcInputs, lines: readonly BonusLine[]): CalcInputs {
  const dice = { ...inputs.dice };
  let { modifier, stamina } = inputs;
  for (const { bonus, applies } of lines) {
    if (!applies) continue;
    for (const die of DICE) dice[die] += bonus.dice?.[die] ?? 0;
    modifier += bonus.damage ?? 0;
    stamina += bonus.stamina ?? 0;
  }
  return { dice, modifier, stamina: Math.max(0, stamina) };
}

/** "+1 black die · +2 damage · −1 stamina" */
export function bonusText(bonus: AttackBonus): string {
  const dice = DICE.flatMap((die) => {
    const n = bonus.dice?.[die] ?? 0;
    return n ? [`+${String(n)} ${die} ${n === 1 ? 'die' : 'dice'}`] : [];
  });
  const signed = (n: number) => (n > 0 ? `+${String(n)}` : `−${String(-n)}`);
  return [
    ...dice,
    ...(bonus.damage ? [`${signed(bonus.damage)} damage`] : []),
    ...(bonus.stamina ? [`${signed(bonus.stamina)} stamina`] : []),
  ].join(' · ');
}

/** Applying lines that change one input, for the "+1 Heavy Gem" notes beside it. */
export function contributions(
  lines: readonly BonusLine[],
  pick: (bonus: AttackBonus) => number,
): { name: string; amount: number }[] {
  return lines.flatMap(({ upgrade, bonus, applies }) => {
    const amount = applies ? pick(bonus) : 0;
    return amount ? [{ name: upgrade.name, amount }] : [];
  });
}

export const dieBonus = (die: keyof DiceCounts) => (bonus: AttackBonus) => bonus.dice?.[die] ?? 0;
