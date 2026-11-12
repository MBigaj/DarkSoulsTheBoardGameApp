import type { Card, CardBack } from '@/shared/api/types';

type Match = CardBack['for'][number];

/** Does the card have every field the entry lists? `boss: true` = any boss; `combined` = a two-part card. */
function matches(entry: Match, card: Card): boolean {
  if (entry.type !== card.type) return false;
  const c = card as Partial<Record<string, unknown>> & { _id: string };
  if (entry.card !== undefined && entry.card !== c._id) return false;
  if (entry.deck !== undefined && entry.deck !== c.deck) return false;
  if (entry.class !== undefined && entry.class !== c.class) return false;
  if (entry.level !== undefined && entry.level !== c.level) return false;
  if (entry.combined && !(Array.isArray(c.parts) && c.parts.length > 0)) return false;
  if (entry.boss === true) return c.boss !== undefined;
  if (entry.boss !== undefined) {
    const boss = c.boss;
    return Array.isArray(boss) ? boss.includes(entry.boss) : boss === entry.boss;
  }
  return true;
}

/** Fields an entry lists besides `type`: the more it lists, the more specific it is. */
function specificity(entry: Match): number {
  return Object.keys(entry).length;
}

/** The card's back: the matching `for` entry that lists the most fields. Undefined if none matches. */
export function backFor(card: Card, backs: readonly CardBack[]): CardBack | undefined {
  let best: { back: CardBack; score: number } | undefined;
  for (const back of backs) {
    for (const entry of back.for) {
      if (!matches(entry, card)) continue;
      const score = specificity(entry);
      if (!best || score > best.score) best = { back, score };
    }
  }
  return best?.back;
}
