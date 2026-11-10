/** The whole card catalog, paged in from `listCards` (architecture decision 4). */
import type { Api } from './api';
import { ApiError } from './errors';
import type { Card } from './types';

export type Catalog = { cards: Card[]; version: string };

/** Largest page the API serves; fewer round trips for the background load. */
export const CATALOG_PAGE = 100;
const ATTEMPTS = 3;

/**
 * Pages through every card. If the version changes mid-way (the data was reseeded), the pages
 * don't belong together, so it starts again; after a few tries it gives up with a 409.
 */
export async function fetchCatalog(listCards: Api['listCards']): Promise<Catalog> {
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const catalog = await pageThrough(listCards);
    if (catalog) return catalog;
  }
  throw new ApiError({
    type: 'about:blank',
    title: 'Conflict',
    status: 409,
    detail: 'The catalog kept changing while it was loading.',
  });
}

/** One pass over every page; null if the version changed on the way. */
async function pageThrough(listCards: Api['listCards']): Promise<Catalog | null> {
  const first = await listCards({ limit: CATALOG_PAGE });
  const cards = [...first.items];
  let cursor = first.nextCursor;
  while (cursor !== null) {
    const page = await listCards({ cursor, limit: CATALOG_PAGE });
    if (page.version !== first.version) return null;
    cards.push(...page.items);
    cursor = page.nextCursor;
  }
  return { cards, version: first.version };
}
