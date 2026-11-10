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

/** Name or ID, case-insensitive. */
export function matchesSearch(card: Card, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (needle === '') return true;
  return card.name.toLowerCase().includes(needle) || card._id.includes(needle);
}

/** A shared card passes when any set it ships in is ticked. */
export function matchesCommon(card: Card, filters: CommonFilters): boolean {
  const sets = filters.sets;
  return (
    (sets.length === 0 || cardSets(card).some((set) => sets.includes(set))) &&
    matchesSearch(card, filters.q)
  );
}
