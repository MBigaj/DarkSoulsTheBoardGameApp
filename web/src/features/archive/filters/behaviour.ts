/** Behaviour deck filters (owner, 12 Nov): the boss a card belongs to, and behaviour or heat up. */
import type { Behaviour } from '@/shared/api/types';
import { isHeatUp } from '@/shared/lib/format';
import { list, tags, type Values } from '@/shared/lib/url-state';
import { anyOf, anyOfMany } from './match';

export const behaviourFields = {
  /** Boss card `_id`s; the rail lists the bosses in the catalog. */
  boss: tags('boss'),
  kind: list('kind', ['behaviour', 'heatUp'] as const),
};

export type BehaviourFilters = Values<typeof behaviourFields>;

/** A combined card (Ornstein & Smough) belongs to both bosses, and is heat up if a half is. */
export function matchesBehaviour(card: Behaviour, f: BehaviourFilters): boolean {
  const bosses = card.parts.length > 0 ? card.parts.map((part) => part.boss) : [card.boss];
  return (
    anyOfMany(
      f.boss,
      bosses.filter((boss) => boss !== undefined),
    ) && anyOf(f.kind, isHeatUp(card) ? 'heatUp' : 'behaviour')
  );
}
