/**
 * Archive filters per card type, run on the client over the cached catalog.
 * Each type's fields drive its URL params (`lib/url-state`) and, in FE-13, its rail groups.
 */
import type { Card, CardOf, CardType } from '@/shared/api/types';
import {
  createParamMemory,
  pickParams,
  readParams,
  type Fields,
  type ParamMemory,
  type Values,
} from '@/shared/lib/url-state';
import { behaviourFields, matchesBehaviour } from './behaviour';
import { bossFields, matchesBoss } from './boss';
import { commonFields, matchesCommon, type Codes, type CommonFilters } from './common';
import { encounterFields, matchesEncounter } from './encounter';
import { enemyFields, matchesEnemy } from './enemy';
import { eventFields, matchesEvent } from './event';
import { matchesTreasure, treasureFields } from './treasure';

export { commonFields, matchesCommon, type Codes, type CommonFilters };

export const typeFields = {
  treasure: treasureFields,
  enemy: enemyFields,
  boss: bossFields,
  behaviour: behaviourFields,
  encounter: encounterFields,
  event: eventFields,
} satisfies Record<CardType, Fields>;

export type TypeFilters<T extends CardType> = Values<(typeof typeFields)[T]>;

const matchers: { [T in CardType]: (card: CardOf<T>, filters: TypeFilters<T>) => boolean } = {
  treasure: matchesTreasure,
  enemy: matchesEnemy,
  boss: matchesBoss,
  behaviour: matchesBehaviour,
  encounter: matchesEncounter,
  event: matchesEvent,
};

/** Every common and type filter at once (all of); cards of other types are dropped. */
export function filterCards<T extends CardType>(
  type: T,
  cards: readonly Card[],
  common: CommonFilters,
  filters: TypeFilters<T>,
  codes?: Codes,
): CardOf<T>[] {
  const matches = matchers[type];
  return cards.filter(
    (card): card is CardOf<T> =>
      card.type === type &&
      matchesCommon(card, common, codes) &&
      matches(card as CardOf<T>, filters),
  );
}

/** Reads one type tab's state from the URL. */
export function readArchiveParams<T extends CardType>(type: T, params: URLSearchParams) {
  return {
    common: readParams(commonFields, params),
    filters: readParams(typeFields[type], params),
  };
}

/** Session memory of each type's filters, so switching tabs restores them. */
export function createArchiveMemory(storage?: Pick<Storage, 'getItem' | 'setItem'>): ParamMemory {
  return createParamMemory('archive-filters', storage);
}

/** Call whenever a type tab's URL changes: keeps only that type's filter params. */
export function rememberFilters(memory: ParamMemory, type: CardType, params: URLSearchParams) {
  memory.save(type, pickParams(typeFields[type], params));
}

/**
 * Search string for switching to `type`: the current set, search and sort carry over; the
 * type's own filters come back from memory. Other params (`?card=`, the old tab's filters) drop.
 */
export function tabSearch(memory: ParamMemory, type: CardType, current: URLSearchParams): string {
  const next = pickParams(commonFields, current);
  for (const [key, value] of memory.load(type)) next.set(key, value);
  return next.toString();
}
