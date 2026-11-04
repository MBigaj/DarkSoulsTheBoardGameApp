import { describe, expect, it } from 'vitest';
import type { DiceCounts, DiceTable } from '@/shared/api/types';
import { attackSummary, expectedDamage, sumDistribution } from './dice';

// The faces in dice.json; every expected value below is worked out by hand from them.
const DICE: DiceTable = {
  black: { kind: 'attack', faces: [0, 1, 1, 1, 2, 2] },
  blue: { kind: 'attack', faces: [1, 1, 2, 2, 2, 3] },
  orange: { kind: 'attack', faces: [1, 2, 2, 3, 3, 3] },
  green: { kind: 'dodge', faces: [0, 0, 0, 1, 1, 1] },
};

describe('sumDistribution', () => {
  it.each<[string, DiceCounts, number[], number]>([
    ['empty pool', {}, [1], 1],
    ['1 black', { black: 1 }, [1, 3, 2], 6],
    ['1 black + 1 blue', { black: 1, blue: 1 }, [0, 2, 9, 14, 9, 2], 36],
    ['2 orange', { orange: 2 }, [0, 0, 1, 4, 10, 12, 9], 36],
  ])('%s', (_name, pool, counts, total) => {
    expect(sumDistribution(pool, DICE)).toEqual({ counts, total });
  });

  it('stays exact for the largest pool (4 of each, 6^12 outcomes)', () => {
    const { counts, total } = sumDistribution({ black: 4, blue: 4, orange: 4 }, DICE);
    expect(total).toBe(6 ** 12);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(total);
    expect(expectedDamage({ counts, total }, 0, 0)).toBeCloseTo((4 * (7 + 11 + 14)) / 6, 12);
  });
});

describe('attackSummary', () => {
  // [name, pool, modifier, average, max, ≥1 vs block 2, expected vs defence 0–4]
  it.each<[string, DiceCounts, number, number, number, number, number[]]>([
    // Edge cases first: no dice at all.
    ['empty pool', {}, 0, 0, 0, 0, [0, 0, 0, 0, 0]],
    ['empty pool, +3', {}, 3, 3, 3, 1, [3, 2, 1, 0, 0]],
    ['empty pool, −2', {}, -2, 0, 0, 0, [0, 0, 0, 0, 0]],
    // Single dice: the means printed in the game data (1.17, 1.83, 2.33).
    ['1 black', { black: 1 }, 0, 7 / 6, 2, 0, [7 / 6, 2 / 6, 0, 0, 0]],
    ['1 blue', { blue: 1 }, 0, 11 / 6, 3, 1 / 6, [11 / 6, 5 / 6, 1 / 6, 0, 0]],
    ['1 orange', { orange: 1 }, 0, 14 / 6, 3, 3 / 6, [14 / 6, 8 / 6, 3 / 6, 0, 0]],
    // Mixed pools.
    [
      '1 black + 1 blue',
      { black: 1, blue: 1 },
      0,
      3,
      5,
      25 / 36,
      [108 / 36, 72 / 36, 38 / 36, 13 / 36, 2 / 36],
    ],
    [
      '2 orange',
      { orange: 2 },
      0,
      28 / 6,
      6,
      35 / 36,
      [168 / 36, 132 / 36, 96 / 36, 61 / 36, 30 / 36],
    ],
    // Every modifier the calculator offers, on 1 black die.
    ['1 black, −2', { black: 1 }, -2, 0, 0, 0, [0, 0, 0, 0, 0]],
    ['1 black, −1', { black: 1 }, -1, 2 / 6, 1, 0, [2 / 6, 0, 0, 0, 0]],
    ['1 black, +1', { black: 1 }, 1, 13 / 6, 3, 2 / 6, [13 / 6, 7 / 6, 2 / 6, 0, 0]],
    ['1 black, +2', { black: 1 }, 2, 19 / 6, 4, 5 / 6, [19 / 6, 13 / 6, 7 / 6, 2 / 6, 0]],
    ['1 black, +3', { black: 1 }, 3, 25 / 6, 5, 1, [25 / 6, 19 / 6, 13 / 6, 7 / 6, 2 / 6]],
  ])('%s', (_name, pool, modifier, average, max, hitVsBlock2, expectedByDefence) => {
    const summary = attackSummary(pool, DICE, modifier);
    expect(summary.average).toBeCloseTo(average, 12);
    expect(summary.max).toBe(max);
    expect(summary.hitVsBlock2).toBeCloseTo(hitVsBlock2, 12);
    summary.expectedByDefence.forEach((value, def) => {
      expect(value).toBeCloseTo(expectedByDefence[def] ?? NaN, 12);
    });
  });

  it('never expects negative damage, and more defence never means more damage', () => {
    for (let black = 0; black <= 2; black++)
      for (let blue = 0; blue <= 2; blue++)
        for (let orange = 0; orange <= 2; orange++)
          for (let modifier = -2; modifier <= 3; modifier++) {
            const { expectedByDefence } = attackSummary({ black, blue, orange }, DICE, modifier);
            expectedByDefence.forEach((value, def) => {
              expect(value).toBeGreaterThanOrEqual(0);
              if (def > 0) expect(value).toBeLessThanOrEqual(expectedByDefence[def - 1] ?? 0);
            });
          }
  });
});
