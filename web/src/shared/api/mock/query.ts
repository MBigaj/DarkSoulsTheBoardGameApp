/** Pure catalog helpers for mockApi: `_id` order, keyset pagination and the catalog version. */
import { badRequest } from '../errors';
import type { Card } from '../types';

export const DEFAULT_LIMIT = 48;
export const MAX_LIMIT = 100;

export function clampLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.trunc(limit)));
}

export function sortById(cards: readonly Card[]): Card[] {
  return [...cards].sort((a, b) => (a._id < b._id ? -1 : a._id > b._id ? 1 : 0));
}

const toBase64Url = (text: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');

/** Opaque to callers: base64url of the last `_id` on the page. */
export function encodeCursor(id: string): string {
  return toBase64Url(JSON.stringify(['id', id]));
}

function decodeCursor(cursor: string): string {
  try {
    const binary = atob(cursor.replaceAll('-', '+').replaceAll('_', '/'));
    const json = new TextDecoder().decode(Uint8Array.from(binary, (ch) => ch.charCodeAt(0)));
    const [kind, id] = JSON.parse(json) as unknown[];
    if (kind === 'id' && typeof id === 'string') return id;
  } catch {
    // Reported below.
  }
  throw badRequest('The cursor is invalid.');
}

/** Cards strictly after the cursor's `_id`, so added or removed cards never cause dupes or gaps. */
export function paginate(
  sorted: readonly Card[],
  cursor: string | null | undefined,
  limit: number,
): { items: Card[]; nextCursor: string | null } {
  let start = 0;
  if (cursor) {
    const after = decodeCursor(cursor);
    start = sorted.findIndex((card) => card._id > after);
    if (start === -1) start = sorted.length;
  }
  const items = sorted.slice(start, start + limit);
  const last = items.at(-1);
  const more = start + limit < sorted.length;
  return { items, nextCursor: more && last ? encodeCursor(last._id) : null };
}

/** Catalog version: a hash of every card (FNV-1a, 32-bit, hex). Same data → same version. */
export function catalogVersion(cards: readonly Card[]): string {
  let hash = 0x811c9dc5;
  for (const card of sortById(cards)) {
    const text = JSON.stringify(card);
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
