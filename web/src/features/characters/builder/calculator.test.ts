import { describe, expect, it } from 'vitest';
import type { Attack, DiceTable } from '@/shared/api/types';
import {
  attackInputs,
  clampInputs,
  currentCalc,
  isHighestStamina,
  NO_ATTACK,
  parseCalc,
  strongestOption,
} from './calculator';

// The faces in dice.json (means: black 1.17, blue 1.83, orange 2.33).
const DICE: DiceTable = {
  black: { kind: 'attack', faces: [0, 1, 1, 1, 2, 2] },
  blue: { kind: 'attack', faces: [1, 1, 2, 2, 2, 3] },
  orange: { kind: 'attack', faces: [1, 2, 2, 3, 3, 3] },
  green: { kind: 'dodge', faces: [0, 0, 0, 1, 1, 1] },
};

const attack = (staminaCost: number, dice: Attack['dice'], extra: Partial<Attack> = {}): Attack =>
  ({ staminaCost, dice, damageType: 'physical', ...extra }) as Attack;

describe('strongestOption', () => {
  it('picks the highest average damage, whatever its position', () => {
    // 2 black (2.33) beats 1 blue (1.83) and 1 black (1.17), though it costs the most.
    const options = [attack(0, { black: 1 }), attack(3, { black: 2 }), attack(2, { blue: 1 })];
    expect(strongestOption(options, DICE)).toBe(1);
  });

  it('counts the printed modifier, including negative ones', () => {
    // 1 orange − 1 = 1.33 average, below 1 blue's 1.83.
    const options = [attack(0, { orange: 1 }, { damageModifier: -1 }), attack(0, { blue: 1 })];
    expect(strongestOption(options, DICE)).toBe(1);
  });

  it('on a tie takes the cheaper option, then the first', () => {
    expect(strongestOption([attack(3, { black: 2 }), attack(1, { black: 2 })], DICE)).toBe(1);
    expect(strongestOption([attack(2, { black: 2 }), attack(2, { black: 2 })], DICE)).toBe(0);
  });

  it('is null for a card with no attacks', () => {
    expect(strongestOption([], DICE)).toBeNull();
  });
});

describe('clampInputs', () => {
  it('keeps every value inside what the controls can show', () => {
    const inputs = {
      dice: { black: 7, blue: -1, orange: 2 },
      modifier: 5,
      stamina: -3,
    };
    expect(clampInputs(inputs)).toEqual({
      dice: { black: 4, blue: 0, orange: 2 },
      modifier: 3,
      stamina: 0,
    });
  });
});

describe('parseCalc', () => {
  it('throws away a malformed save instead of half-loading it', () => {
    expect(
      parseCalc({
        option: 0,
        inputs: { dice: { black: 1 }, modifier: 0, stamina: 0 },
      }),
    ).toBeNull();
    expect(parseCalc({ option: -1, inputs: null })).toBeNull();
  });
});

describe('currentCalc', () => {
  const options = [attack(0, { black: 1 }), attack(3, { black: 2 })];

  it('shows the saved settings, else the default weapon’s strongest option, else an empty pool', () => {
    const saved = {
      weapon: 'left',
      option: null,
      inputs: attackInputs(attack(0, { blue: 1 })),
    } as const;
    expect(currentCalc(saved, { right: options, left: [] }, DICE)).toBe(saved);
    expect(currentCalc(null, { right: options, left: [] }, DICE)).toMatchObject({
      weapon: 'right',
      option: 1,
      inputs: { stamina: 3 },
    });
    expect(currentCalc(null, { right: [], left: [] }, DICE)).toEqual({
      weapon: 'right',
      option: null,
      inputs: NO_ATTACK,
    });
  });

  it('defaults to the left hand when only its card attacks (a shield in the right)', () => {
    expect(currentCalc(null, { right: [], left: options }, DICE)).toMatchObject({
      weapon: 'left',
      option: 1,
    });
  });
});

describe('isHighestStamina', () => {
  it('is the loaded option with the highest cost; ties count; edited values never', () => {
    const options = [attack(0, { black: 1 }), attack(3, { black: 2 }), attack(3, { blue: 1 })];
    expect(isHighestStamina(options, 1)).toBe(true);
    expect(isHighestStamina(options, 2)).toBe(true);
    expect(isHighestStamina(options, 0)).toBe(false);
    expect(isHighestStamina(options, null)).toBe(false);
  });
});
