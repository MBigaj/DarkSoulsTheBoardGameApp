/** Damage calculator inputs and the right-hand card's attack options. Pure; dice maths is in dice.ts. */

import type { Attack, DiceTable } from '@/shared/api/types';
import { attackSummary } from '@/shared/lib/dice';
import { DICE, type Die } from '@/shared/lib/card-types';

/** What the calculator works from. Always inside the limits below (see `clampInputs`). */
export type CalcInputs = {
  dice: Record<Die, number>;
  modifier: number;
  stamina: number;
};

/** The equipped hand whose card the calculator attacks with (owner, 18 Nov: backups can't attack). */
export type Hand = 'right' | 'left';
export const HANDS: readonly Hand[] = ['right', 'left'];

/**
 * A party slot's calculator. `weapon` = which hand's card; `option` = the attack option the inputs
 * were loaded from, or null once a value was edited; `inputs` = the card's values (upgrades are added
 * on top, see upgradeBonus.ts). The slot's `calc` is null until the player touches it: the page
 * shows the default weapon's strongest option then.
 */
export type Calc = { weapon: Hand; option: number | null; inputs: CalcInputs };

export const LIMITS = {
  dice: { min: 0, max: 4 },
  modifier: { min: -2, max: 3 },
  stamina: { min: 0, max: 10 },
  /** Enemies have 1, 5 or 10 health; bosses 20–40. */
  health: { min: 1, max: 40 },
} as const;

export const DEFAULT_HEALTH = 5;

/** A health value the slider can show. */
export function clampHealth(health: number): number {
  return clamp(health, LIMITS.health);
}

const clamp = (value: number, { min, max }: { min: number; max: number }) =>
  Math.min(max, Math.max(min, Math.round(value)));

/** The inputs moved inside the limits, so the state never holds a value the controls can't show. */
export function clampInputs(inputs: CalcInputs): CalcInputs {
  return {
    dice: {
      black: clamp(inputs.dice.black, LIMITS.dice),
      blue: clamp(inputs.dice.blue, LIMITS.dice),
      orange: clamp(inputs.dice.orange, LIMITS.dice),
    },
    modifier: clamp(inputs.modifier, LIMITS.modifier),
    stamina: clamp(inputs.stamina, LIMITS.stamina),
  };
}

/** Nothing to attack with: an empty pool. */
export const NO_ATTACK: CalcInputs = {
  dice: { black: 0, blue: 0, orange: 0 },
  modifier: 0,
  stamina: 0,
};

/** An attack option as calculator inputs. */
export function attackInputs(attack: Attack): CalcInputs {
  return clampInputs({
    dice: {
      black: attack.dice.black ?? 0,
      blue: attack.dice.blue ?? 0,
      orange: attack.dice.orange ?? 0,
    },
    // Absent = the card prints no modifier.
    modifier: attack.damageModifier ?? 0,
    stamina: attack.staminaCost,
  });
}

/**
 * The option loaded by default: the highest average damage; on a tie the cheaper one in stamina,
 * then the first. Null when the card has no attacks.
 */
export function strongestOption(attacks: readonly Attack[], dice: DiceTable): number | null {
  let best: { index: number; average: number; stamina: number } | null = null;
  for (const [index, attack] of attacks.entries()) {
    const { average } = attackSummary(attack.dice, dice, attack.damageModifier ?? 0);
    const stamina = attack.staminaCost;
    if (!best || average > best.average || (average === best.average && stamina < best.stamina)) {
      best = { index, average, stamina };
    }
  }
  return best?.index ?? null;
}

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** A saved calculator, or null (back to the strongest option) if it's missing or malformed. */
export function parseCalc(value: unknown): Calc | null {
  if (typeof value !== 'object' || value === null) return null;
  const { weapon, option, inputs } = value as Partial<Record<string, unknown>>;
  if (!(option === null || (Number.isInteger(option) && (option as number) >= 0))) return null;
  if (typeof inputs !== 'object' || inputs === null) return null;
  const { dice, modifier, stamina } = inputs as Partial<Record<string, unknown>>;
  if (typeof dice !== 'object' || dice === null) return null;
  const counts = dice as Partial<Record<string, unknown>>;
  if (!DICE.every((die) => isCount(counts[die]))) return null;
  if (!isCount(modifier) || !isCount(stamina)) return null;
  return {
    // Saves from before the weapon choice were all right-hand.
    weapon: weapon === 'left' ? 'left' : 'right',
    option: option as number | null,
    inputs: clampInputs({
      dice: {
        black: counts.black as number,
        blue: counts.blue as number,
        orange: counts.orange as number,
      },
      modifier,
      stamina,
    }),
  };
}

/** The default weapon: the right hand if its card attacks, else the left if that one does. */
export function defaultWeapon(attacksIn: Record<Hand, readonly Attack[]>): Hand {
  return attacksIn.right.length === 0 && attacksIn.left.length > 0 ? 'left' : 'right';
}

/** A weapon's strongest option loaded, or an empty pool when it has no attacks. */
export function loadWeapon(weapon: Hand, attacks: readonly Attack[], dice: DiceTable): Calc {
  const option = strongestOption(attacks, dice);
  const attack = option === null ? undefined : attacks[option];
  return attack
    ? { weapon, option, inputs: attackInputs(attack) }
    : { weapon, option: null, inputs: NO_ATTACK };
}

/** What the calculator shows: the slot's saved settings, else the default weapon's strongest option. */
export function currentCalc(
  calc: Calc | null,
  attacksIn: Record<Hand, readonly Attack[]>,
  dice: DiceTable,
): Calc {
  if (calc) return calc;
  const weapon = defaultWeapon(attacksIn);
  return loadWeapon(weapon, attacksIn[weapon], dice);
}

/** The loaded option is the weapon's highest-stamina attack (for "highest-stamina attack" upgrades). */
export function isHighestStamina(attacks: readonly Attack[], option: number | null): boolean {
  const attack = option === null ? undefined : attacks[option];
  return attack !== undefined && attacks.every((a) => a.staminaCost <= attack.staminaCost);
}
