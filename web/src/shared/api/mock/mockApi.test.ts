import { describe, expect, it } from 'vitest';
import { CARD_TYPES, type CardType } from '@/shared/lib/card-types';
import { fetchCatalog } from '../catalog';
import { isApiError } from '../errors';
import type { Card, CardListQuery, CardPage } from '../types';
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
const allIds = fixtureIds.map((f) => f.id).sort();
const idsOf = (type: CardType) =>
  fixtureIds
    .filter((f) => f.type === type)
    .map((f) => f.id)
    .sort();

async function walk(query: Omit<CardListQuery, 'cursor'>): Promise<CardPage[]> {
  const pages: CardPage[] = [];
  let cursor: string | null = null;
  for (let i = 0; i < 100; i++) {
    const page = await mockApi.listCards({ ...query, cursor });
    pages.push(page);
    cursor = page.nextCursor;
    if (cursor === null) return pages;
  }
  throw new Error('pagination did not end');
}

describe('mockApi.listCards: catalog paging', () => {
  it.each([1, 2, 5, 7, 48])(
    'limit %i, no type: every card exactly once, in _id order',
    async (limit) => {
      const pages = await walk({ limit });
      expect(pages.flatMap((p) => p.items).map((c) => c._id)).toEqual(allIds);
      for (const page of pages) expect(page.items.length).toBeLessThanOrEqual(limit);
    },
  );

  it.each(CARD_TYPES)('type %s, limit 2: every card of the type exactly once', async (type) => {
    const pages = await walk({ type, limit: 2 });
    expect(pages.flatMap((p) => p.items).map((c) => c._id)).toEqual(idsOf(type));
    expect(pages.every((p) => p.total === idsOf(type).length)).toBe(true);
  });

  it('every page carries the same catalog version, with or without type', async () => {
    const versions = new Set([
      ...(await walk({ limit: 3 })).map((p) => p.version),
      ...(await walk({ type: 'treasure', limit: 3 })).map((p) => p.version),
    ]);
    expect(versions.size).toBe(1);
    expect([...versions][0]).toMatch(/^[0-9a-f]{8}$/);
  });

  it('a tampered cursor is a 400 problem', async () => {
    const error: unknown = await mockApi
      .listCards({ cursor: 'not-a-cursor' })
      .catch((e: unknown) => e);
    expect(isApiError(error) && error.status).toBe(400);
  });
});

describe('fetchCatalog', () => {
  it('loads every card from the mock, with its version', async () => {
    const catalog = await fetchCatalog((q) => mockApi.listCards(q));
    expect(catalog.cards.map((c) => c._id)).toEqual(allIds);
    expect(catalog.version).toBe((await mockApi.listCards({ limit: 1 })).version);
  });

  it('starts again when the version changes mid-way, and gives up after a few tries', async () => {
    const card = { _id: 'tog-event-x' } as Card;
    const pages = (versions: string[]) => {
      let call = 0;
      return () => {
        const version = versions[call] ?? 'z';
        const last = call % 2 === 1;
        call++;
        return Promise.resolve({ items: [card], nextCursor: last ? null : 'c', total: 2, version });
      };
    };
    // Attempt 1 sees v1 then v2 (reseeded), attempt 2 sees v2 twice.
    expect(await fetchCatalog(pages(['v1', 'v2', 'v2', 'v2']))).toEqual({
      cards: [card, card],
      version: 'v2',
    });
    const failing = pages(['a', 'b', 'c', 'd', 'e', 'f']);
    const error: unknown = await fetchCatalog(failing).catch((e: unknown) => e);
    expect(isApiError(error) && error.status).toBe(409);
  });
});
