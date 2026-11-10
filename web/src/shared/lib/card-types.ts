/** The six card types, as stored in card JSON (`type`). */
export const CARD_TYPES = ['treasure', 'enemy', 'boss', 'behaviour', 'encounter', 'event'] as const;
export type CardType = (typeof CARD_TYPES)[number];

/** Core sets, as stored in card JSON (`set`). */
export const SET_CODES = ['sc', 'tog', 'pwa'] as const;
export type SetCode = (typeof SET_CODES)[number];

/** `set` on a card: a core set, or `shared` for a card printed in several (listed in `sets`). */
export type CardSet = SetCode | 'shared';

/** Every core set a card ships in: its `set`, or its `sets` when it's shared. */
export function cardSets(card: { set: CardSet; sets?: readonly SetCode[] }): readonly SetCode[] {
  if (card.set !== 'shared') return [card.set];
  return card.sets === undefined ? [] : card.sets;
}

/** Attack/defence dice that appear on cards and in filters. */
export const DICE = ['black', 'blue', 'orange'] as const;
export type Die = (typeof DICE)[number];
