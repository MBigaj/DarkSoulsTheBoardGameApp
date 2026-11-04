/**
 * Api over HTTP (/api/v1). Owned by the backend owner: each method is filled in as its endpoint
 * ships, then switched on with VITE_API_HTTP (e.g. `VITE_API_HTTP=cards`).
 * Every failure must surface as an ApiError; use errorFromResponse for non-2xx responses.
 */
import type { Api } from '../api';
import { ApiError, errorFromResponse } from '../errors';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

/** GET/POST JSON helper for the owner's implementation. */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  const response = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!response.ok) throw await errorFromResponse(response);
  return (await response.json()) as T;
}

function notImplemented(method: keyof Api): ApiError {
  return new ApiError({
    type: 'about:blank',
    title: 'Not Implemented',
    status: 501,
    detail: `httpApi.${method} isn't implemented yet (web/src/shared/api/http/httpApi.ts).`,
  });
}

export const httpApi: Api = {
  getCardsOverview: () => Promise.reject(notImplemented('getCardsOverview')),
  listCards: () => Promise.reject(notImplemented('listCards')),
  getCard: () => Promise.reject(notImplemented('getCard')),
  getDice: () => Promise.reject(notImplemented('getDice')),
  listClasses: () => Promise.reject(notImplemented('listClasses')),
  generateEncounter: () => Promise.reject(notImplemented('generateEncounter')),
  getEncounter: () => Promise.reject(notImplemented('getEncounter')),
};
