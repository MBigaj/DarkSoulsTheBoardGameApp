/** The six card types, as stored in card JSON (`type`). */
export const CARD_TYPES = ['treasure', 'enemy', 'boss', 'behaviour', 'encounter', 'event'] as const;
export type CardType = (typeof CARD_TYPES)[number];

/** Core sets, as stored in card JSON (`set`). */
export const SET_CODES = ['sc', 'tog', 'pwa'] as const;
export type SetCode = (typeof SET_CODES)[number];

/** Attack/defence dice that appear on cards and in filters. */
export const DICE = ['black', 'blue', 'orange'] as const;
export type Die = (typeof DICE)[number];
