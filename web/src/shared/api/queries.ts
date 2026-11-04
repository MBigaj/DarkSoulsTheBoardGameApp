/** TanStack Query hooks: the only way components read or write API data. */
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { api } from './api';
import type { CardPage, CardQuery, ForgeRequest, OverviewQuery } from './types';

export const queryKeys = {
  overview: (query: OverviewQuery) => ['cards', 'overview', query] as const,
  cards: (query: Omit<CardQuery, 'cursor'>) => ['cards', 'list', query] as const,
  card: (id: string) => ['cards', 'detail', id] as const,
  dice: ['dice'] as const,
  classes: ['classes'] as const,
  encounter: (id: string) => ['encounters', id] as const,
};

export function useCardsOverview(query: OverviewQuery) {
  return useQuery({
    queryKey: queryKeys.overview(query),
    queryFn: () => api.getCardsOverview(query),
  });
}

/** Pages of cards; call fetchNextPage while hasNextPage is true. */
export function useCards(query: Omit<CardQuery, 'cursor'>) {
  return useInfiniteQuery<
    CardPage,
    Error,
    InfiniteData<CardPage>,
    readonly unknown[],
    string | null
  >({
    queryKey: queryKeys.cards(query),
    queryFn: ({ pageParam }) => api.listCards({ ...query, cursor: pageParam }),
    initialPageParam: null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

/** The full card for the close-up; idle while `id` is null. */
export function useCard(id: string | null) {
  return useQuery({
    queryKey: queryKeys.card(id ?? ''),
    queryFn: () => api.getCard(id ?? ''),
    enabled: id !== null,
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
