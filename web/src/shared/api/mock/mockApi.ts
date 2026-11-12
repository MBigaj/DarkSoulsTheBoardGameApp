/**
 * Api on the card JSON in the data store (DSTBG_DATA layout) and the Phase 1 fixtures.
 * Each card type is its own lazy chunk. Dev builds add 150–400 ms per call so loading states
 * are real; tests run with none.
 */
import { CARD_TYPES, type CardType } from '@/shared/lib/card-types';
import type { Api } from '../api';
import { notFound } from '../errors';
import { normalizeCard, type RawCard } from '../normalize/cards';
import type { Card, CardOf, ForgedEncounter } from '../types';
import { catalogVersion, clampLimit, paginate, sortById } from './query';

const SOURCES: Record<CardType, () => Promise<{ default: RawCard[] }>> = {
  treasure: () => import('./sources/treasure'),
  enemy: () => import('./sources/enemy'),
  boss: () => import('./sources/boss'),
  behaviour: () => import('./sources/behaviour'),
  encounter: () => import('./sources/encounter'),
  event: () => import('./sources/event'),
};

const cache = new Map<CardType, Promise<Card[]>>();

/** Normalized cards of one type, in `_id` order. */
function load<T extends CardType>(type: T): Promise<CardOf<T>[]> {
  let cards = cache.get(type);
  if (!cards) {
    cards = SOURCES[type]().then((m) => sortById(m.default.map(normalizeCard)));
    cache.set(type, cards);
  }
  return cards as Promise<CardOf<T>[]>;
}

let catalog: Promise<{ cards: Card[]; version: string }> | undefined;

/** Every card in `_id` order, plus the catalog version (a hash of the data). */
function loadCatalog(): Promise<{ cards: Card[]; version: string }> {
  catalog ??= Promise.all(CARD_TYPES.map((type) => load(type))).then((lists) => {
    const cards = sortById(lists.flat());
    return { cards, version: catalogVersion(cards) };
  });
  return catalog;
}

function latency(): Promise<void> {
  if (!import.meta.env.DEV || import.meta.env.MODE === 'test') return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 250));
}

/** IDs are `{set}-{type}-{slug}`, so the type tells which chunk to load. */
function typeOfId(id: string): CardType | undefined {
  const type = id.split('-')[1];
  return CARD_TYPES.find((t) => t === type);
}

async function forgedEncounters(): Promise<ForgedEncounter[]> {
  return (await import('./sources/encounters')).default;
}

export const mockApi: Api = {
  // Pages exactly like GET /cards: `_id` order, opaque cursor, the catalog version on every page.
  async listCards({ type, cursor, limit }) {
    await latency();
    const { cards, version } = await loadCatalog();
    const matching = type === undefined ? cards : await load(type);
    const page = paginate(matching, cursor, clampLimit(limit));
    return { ...page, total: matching.length, version };
  },

  async getCard(id) {
    await latency();
    const type = typeOfId(id);
    const card = type && (await load(type)).find((c) => c._id === id);
    if (!card) throw notFound(`No card with id "${id}".`);
    return card;
  },

  async listBacks() {
    await latency();
    return (await import('./sources/backs')).default;
  },

  async getDice() {
    await latency();
    const dice = (await import('./sources/dice')).default;
    if (!dice) throw notFound('No dice.json in the data store.');
    return dice;
  },

  async listClasses() {
    await latency();
    return (await import('./sources/classes')).default;
  },

  // Mock mode returns the sample for the requested level; the real generator is the backend's.
  async generateEncounter(request) {
    await latency();
    const encounter = (await forgedEncounters()).find((e) => e.level === request.level);
    if (!encounter) throw notFound(`No sample encounter for level ${String(request.level)}.`);
    return encounter;
  },

  async getEncounter(id) {
    await latency();
    const encounter = (await forgedEncounters()).find((e) => e.id === id);
    if (!encounter) throw notFound(`No encounter with id "${id}".`);
    return encounter;
  },
};
