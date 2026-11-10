/**
 * Everything the Archive shows, derived on the client from the cached catalog (architecture
 * decision 4): sorted lists per type, the All-types overview, and tab and set counts.
 */
import type { Card, CardOf, CardType, SetCode } from '@/shared/api/types';
import { CARD_TYPES, cardSets, SET_CODES } from '@/shared/lib/card-types';
import { compareById } from '@/shared/lib/format';
import { emptyValues } from '@/shared/lib/url-state';
import {
  filterCards,
  matchesCommon,
  typeFields,
  type Codes,
  type CommonFilters,
  type TypeFilters,
} from './filters';

/** Cards per type on the All-types overview. */
export const PREVIEW = 5;

export type SortKey = CommonFilters['sort'];

/** "Card ID" = `_id` order (display codes follow it); "Name A–Z" falls back to `_id` on ties. */
export function sortCards<T extends Card>(cards: readonly T[], sort: SortKey): T[] {
  const byName = (a: T, b: T) =>
    a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || compareById(a, b);
  return [...cards].sort(sort === 'name' ? byName : compareById);
}

/** One type's cards under set, search and that type's filters, sorted. */
export function cardsOfType<T extends CardType>(
  cards: readonly Card[],
  type: T,
  common: CommonFilters,
  filters: TypeFilters<T> = emptyValues(typeFields[type]),
  codes?: Codes,
): CardOf<T>[] {
  return sortCards(filterCards(type, cards, common, filters, codes), common.sort);
}

export type OverviewSection = { type: CardType; total: number; items: Card[] };

/** All types: one section per type, first PREVIEW cards. Only set and search apply. */
export function overview(
  cards: readonly Card[],
  common: CommonFilters,
  codes?: Codes,
): OverviewSection[] {
  return CARD_TYPES.map((type) => {
    const matching = cardsOfType(cards, type, common, undefined, codes);
    return { type, total: matching.length, items: matching.slice(0, PREVIEW) };
  });
}

/**
 * Tab counts. "All types" counts set and search matches; each type tab also applies that
 * type's own filters (the open tab's from the URL, the others' from session memory).
 */
export function tabCounts(
  cards: readonly Card[],
  common: CommonFilters,
  filtersOf: <T extends CardType>(type: T) => TypeFilters<T>,
  codes?: Codes,
): Record<'all' | CardType, number> {
  const counts = {
    all: cards.filter((card) => matchesCommon(card, common, codes)).length,
  } as Record<'all' | CardType, number>;
  for (const type of CARD_TYPES) {
    counts[type] = filterCards(type, cards, common, filtersOf(type), codes).length;
  }
  return counts;
}

/** Cards per core set, of one type or of all; a shared card counts under every set it ships in. */
export function setCounts(cards: readonly Card[], type?: CardType): Record<SetCode, number> {
  const counts = Object.fromEntries(SET_CODES.map((set) => [set, 0])) as Record<SetCode, number>;
  for (const card of cards) {
    if (type !== undefined && card.type !== type) continue;
    for (const set of cardSets(card)) counts[set] += 1;
  }
  return counts;
}
