/**
 * Api on the card JSON in the data store (DSTBG_DATA layout) and the Phase 1 fixtures.
 * Each card type is its own lazy chunk. Dev builds add 150–400 ms per call so loading states
 * are real; tests run with none.
 */
import { CARD_TYPES, SET_CODES, cardSets, type CardType } from '@/shared/lib/card-types';
import type { Api } from '../api';
import { notFound } from '../errors';
import { normalizeCard, type RawCard } from '../normalize/cards';
import type { Card, CardOf, CardPage, ForgedEncounter, OverviewSection } from '../types';
import { clampLimit, inSets, matchesSearch, paginate, sortCards, toSummary } from './query';

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
    cards = SOURCES[type]().then((m) => sortCards(m.default.map(normalizeCard), 'id'));
    cache.set(type, cards);
  }
  return cards as Promise<CardOf<T>[]>;
}

async function loadAll(): Promise<Record<CardType, Card[]>> {
  const lists = await Promise.all(CARD_TYPES.map((type) => load(type)));
  return Object.fromEntries(CARD_TYPES.map((type, i) => [type, lists[i] ?? []])) as Record<
    CardType,
    Card[]
  >;
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
  async getCardsOverview({ sets, q }) {
    await latency();
    const all = await loadAll();
    return CARD_TYPES.map((type): OverviewSection => {
      const matching = all[type].filter((card) => inSets(card, sets) && matchesSearch(card, q));
      return { type, total: matching.length, items: matching.slice(0, 5).map(toSummary) };
    });
  },

  async listCards({ type, sets, q, sort = 'id', cursor, limit }) {
    await latency();
    const all = await loadAll();
    const searched = all[type].filter((card) => matchesSearch(card, q));
    const matching = sortCards(
      searched.filter((card) => inSets(card, sets)),
      sort,
    );
    const page = paginate(matching, sort, cursor, clampLimit(limit));

    const setCounts = Object.fromEntries(
      SET_CODES.map((set) => [set, searched.filter((card) => cardSets(card).includes(set)).length]),
    ) as CardPage['setCounts'];
    const typeCounts = Object.fromEntries(
      CARD_TYPES.map((t) => [
        t,
        all[t].filter((card) => inSets(card, sets) && matchesSearch(card, q)).length,
      ]),
    ) as CardPage['typeCounts'];

    return {
      items: page.items.map(toSummary),
      nextCursor: page.nextCursor,
      total: matching.length,
      setCounts,
      typeCounts,
    };
  },

  async getCard(id) {
    await latency();
    const type = typeOfId(id);
    const card = type && (await load(type)).find((c) => c._id === id);
    if (!card) throw notFound(`No card with id "${id}".`);
    return card;
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
