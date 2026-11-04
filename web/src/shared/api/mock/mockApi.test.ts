import { describe, expect, it } from 'vitest';
import { CARD_TYPES, type CardType } from '@/shared/lib/card-types';
import type { CardSummary, SortKey } from '../types';
import { mockApi } from './mockApi';

// Expected values come straight from the fixture files, independently of mockApi.
const fixtureIds = Object.keys(
  import.meta.glob('/test/fixtures/sets/*/*/*.json', { eager: true, import: 'default' }),
).map((path) => {
  const [, , , , set, type, file] = path.split('/');
  return {
    type: type as CardType,
    id: `${set ?? ''}-${type ?? ''}-${(file ?? '').replace('.json', '')}`,
  };
});
const idsOf = (type: CardType) =>
  fixtureIds
    .filter((f) => f.type === type)
    .map((f) => f.id)
    .sort();

describe('mockApi.getCardsOverview', () => {
  it('gives every type its total and the first 5 cards in _id order', async () => {
    const sections = await mockApi.getCardsOverview({});

    expect(sections.map((s) => s.type)).toEqual(CARD_TYPES);
    for (const section of sections) {
      const ids = idsOf(section.type);
      expect(section.total).toBe(ids.length);
      expect(section.items.map((c) => c._id)).toEqual(ids.slice(0, 5));
    }
    // The fixtures hold more than 5 treasure cards, so the cut-off is exercised.
    expect(idsOf('treasure').length).toBeGreaterThan(5);
  });

  it('counts only cards matching the search', async () => {
    const sections = await mockApi.getCardsOverview({ q: 'skeleton' });
    const totals = Object.fromEntries(sections.map((s) => [s.type, s.total]));
    expect(totals).toMatchObject({ enemy: 2, treasure: 0, boss: 0 });
  });
});

describe('mockApi.listCards: cursor pagination', () => {
  async function walk(type: CardType, sort: SortKey, limit: number): Promise<CardSummary[]> {
    const seen: CardSummary[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < 50; page++) {
      const result = await mockApi.listCards({ type, sort, limit, cursor });
      expect(result.items.length).toBeLessThanOrEqual(limit);
      seen.push(...result.items);
      cursor = result.nextCursor;
      if (cursor === null) return seen;
    }
    throw new Error('pagination did not end');
  }

  it.each([1, 2, 4, 5, 6, 7, 48])(
    'limit %i: every card exactly once, in order, both sorts',
    async (limit) => {
      const byId = await walk('treasure', 'id', limit);
      expect(byId.map((c) => c._id)).toEqual(idsOf('treasure'));

      const byName = await walk('treasure', 'name', limit);
      const names = byName.map((c) => c.name.toLowerCase());
      expect(new Set(byName.map((c) => c._id)).size).toBe(byName.length);
      expect(byName).toHaveLength(idsOf('treasure').length);
      expect(names).toEqual([...names].sort());
    },
  );

  it('the last page has no next cursor, and total counts every match', async () => {
    const page = await mockApi.listCards({ type: 'treasure', limit: 100 });
    expect(page.nextCursor).toBeNull();
    expect(page.total).toBe(idsOf('treasure').length);
  });
});
