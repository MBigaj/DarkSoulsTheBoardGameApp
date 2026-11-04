/** Pure list helpers for mockApi: search, sort, keyset pagination and summaries. */
import { badRequest } from '../errors';
import type { Card, CardSummary, SetCode, SortKey } from '../types';

export const DEFAULT_LIMIT = 48;
export const MAX_LIMIT = 100;

export function clampLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.trunc(limit)));
}

/** Name or ID, case-insensitive. Display codes join in with lib/format (FE-09). */
export function matchesSearch(card: Card, q: string | undefined): boolean {
  const needle = q?.trim().toLowerCase();
  if (!needle) return true;
  return card.name.toLowerCase().includes(needle) || card._id.includes(needle);
}

/** Absent or empty means every set. */
export function inSets(card: Card, sets: readonly SetCode[] | undefined): boolean {
  return sets === undefined || sets.length === 0 || sets.includes(card.set);
}

// The sort key always ends in `_id`, which is unique, so keyset pagination has a strict order.
type Key = readonly string[];

function sortKey(card: Card, sort: SortKey): Key {
  return sort === 'name' ? [card.name.toLowerCase(), card._id] : [card._id];
}

function compareKeys(a: Key, b: Key): number {
  for (let i = 0; i < a.length; i++) {
    const x = a[i] ?? '';
    const y = b[i] ?? '';
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

export function sortCards(cards: readonly Card[], sort: SortKey): Card[] {
  return [...cards].sort((a, b) => compareKeys(sortKey(a, sort), sortKey(b, sort)));
}

/** Opaque to callers: base64url of `[sort, ...key]` for the last item on the page. */
export function encodeCursor(card: Card, sort: SortKey): string {
  const json = JSON.stringify([sort, ...sortKey(card, sort)]);
  return btoa(String.fromCharCode(...new TextEncoder().encode(json)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

function decodeCursor(cursor: string, sort: SortKey): Key {
  try {
    const binary = atob(cursor.replaceAll('-', '+').replaceAll('_', '/'));
    const json = new TextDecoder().decode(Uint8Array.from(binary, (ch) => ch.charCodeAt(0)));
    const [cursorSort, ...key] = JSON.parse(json) as unknown[];
    if (cursorSort === sort && key.every((part) => typeof part === 'string')) {
      return key;
    }
  } catch {
    // Reported below.
  }
  throw badRequest('The cursor is invalid or belongs to a different sort.');
}

/** Cards strictly after the cursor's key, so removed or added cards never cause dupes or gaps. */
export function paginate(
  sorted: readonly Card[],
  sort: SortKey,
  cursor: string | null | undefined,
  limit: number,
): { items: Card[]; nextCursor: string | null } {
  let start = 0;
  if (cursor) {
    const after = decodeCursor(cursor, sort);
    start = sorted.findIndex((card) => compareKeys(sortKey(card, sort), after) > 0);
    if (start === -1) start = sorted.length;
  }
  const items = sorted.slice(start, start + limit);
  const last = items.at(-1);
  const more = start + limit < sorted.length;
  return { items, nextCursor: more && last ? encodeCursor(last, sort) : null };
}

/** Copies only the keys the card has, so absent optional fields stay absent. */
function pick<T extends object, K extends keyof T>(source: T, keys: readonly K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const key of keys) if (key in source) out[key] = source[key];
  return out;
}

const COMMON = ['_id', 'set', 'type', 'name', 'art'] as const;

export function toSummary(card: Card): CardSummary {
  switch (card.type) {
    case 'treasure':
      return pick(card, [
        ...COMMON,
        'deck',
        'rarity',
        'class',
        'boss',
        'equip',
        'hands',
        'requirements',
      ]);
    case 'enemy':
      return pick(card, [...COMMON, 'threat', 'health']);
    case 'boss':
      return pick(card, [...COMMON, 'tier', 'threat', 'health']);
    case 'behaviour':
      return pick(card, [...COMMON, 'boss']);
    case 'encounter':
      return { ...pick(card, [...COMMON, 'level']), tileCount: card.tiles.length };
    case 'event':
      return pick(card, [...COMMON, 'eventType']);
  }
}
