/** TanStack Query hooks: the only way components read or write API data. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { fetchCatalog } from './catalog';
import type { Card, CardType, ForgeRequest } from './types';

/** First page of the visible type: enough to paint a screen of tiles. */
const FIRST_PAGE = 48;

export const queryKeys = {
  firstPage: (type: CardType | 'all') => ['cards', 'first', type] as const,
  catalog: (version: string) => ['cards', 'catalog', version] as const,
  card: (id: string) => ['cards', 'detail', id] as const,
  backs: ['backs'] as const,
  dice: ['dice'] as const,
  classes: ['classes'] as const,
  encounter: (id: string) => ['encounters', id] as const,
};

/**
 * The card catalog. Paints from the first page of `type` (or of every card), then loads the whole
 * catalog in the background into one cache keyed by its version. `cards` holds the first page
 * until `complete`, then every card of every type; callers filter (features/archive/filters).
 */
export function useCatalog(type?: CardType) {
  const first = useQuery({
    queryKey: queryKeys.firstPage(type ?? 'all'),
    queryFn: () => api.listCards({ type, limit: FIRST_PAGE }),
    staleTime: Infinity,
  });
  const version = first.data?.version;
  const full = useQuery({
    queryKey: queryKeys.catalog(version ?? ''),
    queryFn: () => fetchCatalog((query) => api.listCards(query)),
    enabled: version !== undefined,
    staleTime: Infinity,
    gcTime: Infinity, // one catalog per session, kept across pages
  });
  const cards: Card[] = full.data?.cards ?? first.data?.items ?? [];
  return {
    cards,
    version,
    complete: full.isSuccess,
    isPending: first.isPending,
    error: first.error ?? full.error,
  };
}

/** The full card for the close-up; idle while `id` is null. */
export function useCard(id: string | null) {
  return useQuery({
    queryKey: queryKeys.card(id ?? ''),
    queryFn: () => api.getCard(id ?? ''),
    enabled: id !== null,
  });
}

export function useBacks() {
  return useQuery({
    queryKey: queryKeys.backs,
    queryFn: () => api.listBacks(),
    staleTime: Infinity,
  });
}

export function useDice() {
  return useQuery({ queryKey: queryKeys.dice, queryFn: () => api.getDice(), staleTime: Infinity });
}

export function useClasses() {
  return useQuery({
    queryKey: queryKeys.classes,
    queryFn: () => api.listClasses(),
    staleTime: Infinity,
  });
}

export function useEncounter(id: string | null) {
  return useQuery({
    queryKey: queryKeys.encounter(id ?? ''),
    queryFn: () => api.getEncounter(id ?? ''),
    enabled: id !== null,
    staleTime: Infinity, // a stored encounter never changes
  });
}

/** Forge a new encounter; the result is cached under its id, so /forge/:id renders at once. */
export function useGenerateEncounter() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: ForgeRequest) => api.generateEncounter(request),
    onSuccess: (encounter) => {
      client.setQueryData(queryKeys.encounter(encounter.id), encounter);
    },
  });
}
