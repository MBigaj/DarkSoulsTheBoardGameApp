/** Encounter filters (handoff filter table, Encounter rows). */
import type { Encounter, SpecialRuleKeyword } from '@/shared/api/types';
import { list, type Values } from '@/shared/lib/url-state';
import { anyOf, anyOfMany, every } from './match';

const INCLUDES = ['traps', 'chests', 'trial'] as const;
export type EncounterInclude = (typeof INCLUDES)[number];

export const encounterFields = {
  /** `boss` = a boss encounter (it has `boss` instead of `level`). */
  level: list('level', [1, 2, 3, 'boss'] as const),
  tiles: list('tiles', [1, 2, 3, 4] as const),
  includes: list('includes', INCLUDES),
  keywords: list(
    'rule',
    every<SpecialRuleKeyword>()([
      'barrage',
      'bitterCold',
      'darkness',
      'eerie',
      'gang',
      'hidden',
      'illusion',
      'mimic',
      'onslaught',
      'poisonMist',
      'snowstorm',
      'timer',
    ]),
  ),
};

export type EncounterFilters = Values<typeof encounterFields>;

function includes(card: Encounter): EncounterInclude[] {
  const found: EncounterInclude[] = [];
  if (card.tiles.some((tile) => tile.trapped)) found.push('traps');
  if (
    card.tiles.some((tile) => Object.values(tile.setup).some((items) => items.includes('chest')))
  ) {
    found.push('chests');
  }
  if (card.trial !== undefined) found.push('trial');
  return found;
}

export function matchesEncounter(card: Encounter, f: EncounterFilters): boolean {
  const keywords = card.specialRules.flatMap((rule) =>
    rule.keyword === undefined ? [] : [rule.keyword],
  );
  return (
    anyOf(f.level, card.boss === undefined ? card.level : 'boss') &&
    anyOf<number>(f.tiles, card.tiles.length) &&
    anyOfMany(f.includes, includes(card)) &&
    anyOfMany(f.keywords, keywords)
  );
}
