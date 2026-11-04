import { CARD_IMAGE } from './card-image-sizes';

/** Where scripts/build-images.ts puts the WebP files (web/public/images). */
const BASE = '/images/';

export type CardImageSources = { src: string; srcSet: string };

/**
 * Card `art` ("tog/treasure/fireball.png") → the generated WebP files.
 * null when the card has no art.
 */
export function cardImageSources(art: string | null | undefined): CardImageSources | null {
  if (!art) return null;
  const base = BASE + art.replace(/\.png$/i, '');
  const full = `${base}.webp`;
  const tile = `${base}-${String(CARD_IMAGE.tileWidth)}.webp`;
  return {
    src: full,
    srcSet: `${tile} ${String(CARD_IMAGE.tileWidth)}w, ${full} ${String(CARD_IMAGE.fullWidth)}w`,
  };
}
