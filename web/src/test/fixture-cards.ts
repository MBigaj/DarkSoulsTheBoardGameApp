/** The committed fixture cards (`test/fixtures/sets`), normalized, for unit tests. */
import { normalizeCard, type RawCard } from '@/shared/api/normalize/cards';
import type { Card, CardOf, CardType } from '@/shared/api/types';

export const fixtureCards: Card[] = Object.values(
  import.meta.glob<RawCard>('/test/fixtures/sets/*/*/*.json', { eager: true, import: 'default' }),
)
  .map(normalizeCard)
  .sort((a, b) => (a._id < b._id ? -1 : 1));

/** One fixture card by `_id`; throws so a renamed fixture fails loudly. */
export function fixture<T extends CardType>(type: T, id: string): CardOf<T> {
  const card = fixtureCards.find((c) => c._id === id);
  if (card?.type !== type) throw new Error(`No ${type} fixture ${id}`);
  return card as CardOf<T>;
}
