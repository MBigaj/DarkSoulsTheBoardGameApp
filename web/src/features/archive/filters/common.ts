/** Filters on every archive view, All types included: core set, search and sort. */
import type { Card } from '@/shared/api/types';
import { cardSets, SET_CODES } from '@/shared/lib/card-types';
import { choice, list, text, type Values } from '@/shared/lib/url-state';

export const commonFields = {
  sets: list('set', SET_CODES),
  q: text('q'),
  sort: choice('sort', ['id', 'name'], 'id'),
};

export type CommonFilters = Values<typeof commonFields>;

/** Display code per `_id` (lib/format `displayCodes`), so a search for "TOG-012" finds the tile. */
export type Codes = ReadonlyMap<string, string>;

/** Name, `_id` or display code, case-insensitive. */
export function matchesSearch(card: Card, q: string, codes?: Codes): boolean {
  const needle = q.trim().toLowerCase();
  if (needle === '') return true;
  const code = codes?.get(card._id)?.toLowerCase();
  return (
    card.name.toLowerCase().includes(needle) ||
    card._id.includes(needle) ||
    (code !== undefined && code.includes(needle))
  );
}

/** A shared card passes when any set it ships in is ticked. */
export function matchesSets(card: Card, sets: CommonFilters['sets']): boolean {
  return sets.length === 0 || cardSets(card).some((set) => sets.includes(set));
}

export function matchesCommon(card: Card, filters: CommonFilters, codes?: Codes): boolean {
  return matchesSets(card, filters.sets) && matchesSearch(card, filters.q, codes);
}
