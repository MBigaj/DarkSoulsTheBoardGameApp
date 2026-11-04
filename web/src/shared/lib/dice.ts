/**
 * Attack dice maths for the damage calculator.
 * Distributions are kept as exact outcome counts (out of 6^n), so probabilities are exact
 * fractions until the final division; 12 dice is 6^12 ≈ 2.2e9 outcomes, well inside 2^53.
 */
import type { DiceCounts, DiceTable } from '@/shared/api/types';
import { DICE } from './card-types';

/** `counts[s]` = number of outcomes whose faces sum to `s`; `total` = all outcomes (6^n). */
export type SumDistribution = { counts: readonly number[]; total: number };

/** Sum of the pool's faces. An empty pool always sums to 0. Faces come from dice.json. */
export function sumDistribution(pool: DiceCounts, dice: DiceTable): SumDistribution {
  let counts = [1];
  let total = 1;
  for (const die of DICE) {
    const { faces } = dice[die];
    for (let n = 0; n < (pool[die] ?? 0); n++) {
      const next: (number | undefined)[] = []; // sparse: some sums may be unreachable
      counts.forEach((ways, sum) => {
        if (ways === 0) return;
        for (const face of faces) next[sum + face] = (next[sum + face] ?? 0) + ways;
      });
      counts = Array.from(next, (ways) => ways ?? 0);
      total *= faces.length;
    }
  }
  return { counts, total };
}

/** Σ P(sum) × max(0, sum + modifier − defence): damage is never negative. */
export function expectedDamage(dist: SumDistribution, modifier: number, defence: number): number {
  let weighted = 0;
  dist.counts.forEach((ways, sum) => {
    weighted += ways * Math.max(0, sum + modifier - defence);
  });
  return weighted / dist.total;
}

/** P(sum + modifier − defence ≥ 1): the attack deals at least 1 damage. */
export function chanceToDamage(dist: SumDistribution, modifier: number, defence: number): number {
  let hits = 0;
  dist.counts.forEach((ways, sum) => {
    if (sum + modifier - defence >= 1) hits += ways;
  });
  return hits / dist.total;
}

/** Highest possible damage against no defence. */
export function maxDamage(dist: SumDistribution, modifier: number): number {
  return Math.max(0, dist.counts.length - 1 + modifier);
}

export type AttackSummary = {
  /** Expected damage against defence 0, 1, 2, 3, 4 (index = defence). */
  expectedByDefence: number[];
  /** "Avg total": expected damage against no defence. */
  average: number;
  /** "Max total". */
  max: number;
  /** "≥1 vs block 2", 0–1. */
  hitVsBlock2: number;
};

/** Everything the damage calculator shows, for one attack. */
export function attackSummary(pool: DiceCounts, dice: DiceTable, modifier: number): AttackSummary {
  const dist = sumDistribution(pool, dice);
  return {
    expectedByDefence: [0, 1, 2, 3, 4].map((def) => expectedDamage(dist, modifier, def)),
    average: expectedDamage(dist, modifier, 0),
    max: maxDamage(dist, modifier),
    hitVsBlock2: chanceToDamage(dist, modifier, 2),
  };
}
