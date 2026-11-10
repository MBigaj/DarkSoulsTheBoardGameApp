/**
 * Image URL for an `art` key ("tog/treasure/fireball.png"): VITE_IMAGE_BASE_URL + key.
 * Dev and the prod image serve `/images` from the store's images/ folder; later a CDN.
 */
const BASE = (import.meta.env.VITE_IMAGE_BASE_URL ?? '/images').replace(/\/+$/, '');

/** null when there is no art. */
export function imageUrl(art: string | null | undefined): string | null {
  if (!art) return null;
  return `${BASE}/${art.replace(/^\/+/, '')}`;
}
