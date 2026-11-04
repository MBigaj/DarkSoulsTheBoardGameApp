/**
 * Sizes of the generated card images, shared by scripts/build-images.ts (which writes them) and
 * card-image.ts (which builds srcset from them). Full = the printed treasure scan, 571 × 850.
 */
export const CARD_IMAGE = {
  fullWidth: 571,
  fullHeight: 850,
  tileWidth: 300,
} as const;
