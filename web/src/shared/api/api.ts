/**
 * The seam between the UI and its data. Components never call this directly: they use the hooks
 * in queries.ts, which call `api`. Each endpoint group runs on mockApi or httpApi:
 *   VITE_API_MODE=mock (default)  everything on mocks
 *   VITE_API_MODE=http            everything over HTTP
 *   VITE_API_HTTP=cards,dice      these groups over HTTP, the rest on mocks
 * Both implementations are lazy chunks, so a build only downloads the one it uses.
 */
import type {
  Card,
  CardBack,
  CardListQuery,
  CardPage,
  ClassDef,
  DiceTable,
  ForgedEncounter,
  ForgeRequest,
} from './types';

export interface Api {
  /** One page of the catalog in `_id` order; every page carries the catalog version. */
  listCards(query: CardListQuery): Promise<CardPage>;
  /** The full card, for the close-up. 404 → ApiError. */
  getCard(id: string): Promise<Card>;
  /** Every card back; the client picks a card's with `backFor`. */
  listBacks(): Promise<CardBack[]>;
  getDice(): Promise<DiceTable>;
  listClasses(): Promise<ClassDef[]>;
  generateEncounter(request: ForgeRequest): Promise<ForgedEncounter>;
  getEncounter(id: string): Promise<ForgedEncounter>;
}

export type EndpointGroup = 'cards' | 'dice' | 'classes' | 'encounters';

const GROUP: Record<keyof Api, EndpointGroup> = {
  listCards: 'cards',
  getCard: 'cards',
  listBacks: 'cards',
  getDice: 'dice',
  listClasses: 'classes',
  generateEncounter: 'encounters',
  getEncounter: 'encounters',
};

const httpGroups = new Set(
  (import.meta.env.VITE_API_HTTP ?? '')
    .split(',')
    .map((group) => group.trim())
    .filter(Boolean),
);

function usesHttp(group: EndpointGroup): boolean {
  return import.meta.env.VITE_API_MODE === 'http' || httpGroups.has(group);
}

function implementation(method: keyof Api): Promise<Api> {
  return usesHttp(GROUP[method])
    ? import('./http/httpApi').then((m) => m.httpApi)
    : import('./mock/mockApi').then((m) => m.mockApi);
}

export const api: Api = {
  listCards: async (query) => (await implementation('listCards')).listCards(query),
  getCard: async (id) => (await implementation('getCard')).getCard(id),
  listBacks: async () => (await implementation('listBacks')).listBacks(),
  getDice: async () => (await implementation('getDice')).getDice(),
  listClasses: async () => (await implementation('listClasses')).listClasses(),
  generateEncounter: async (request) =>
    (await implementation('generateEncounter')).generateEncounter(request),
  getEncounter: async (id) => (await implementation('getEncounter')).getEncounter(id),
};
