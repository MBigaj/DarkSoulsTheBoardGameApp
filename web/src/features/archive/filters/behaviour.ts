/** Behaviour decks have no filters yet (handoff: "Filters for behaviour decks come later."). */
import type { Behaviour } from '@/shared/api/types';

export const behaviourFields = {};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- no filters yet, by design
export type BehaviourFilters = {};

export function matchesBehaviour(_card: Behaviour, _f: BehaviourFilters): boolean {
  return true;
}
