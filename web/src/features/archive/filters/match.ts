/**
 * Filter semantics shared by every card type (handoff, "Card Archive"):
 * - options within one filter: any of; separate filters: all of;
 * - `undefined` = the field doesn't apply to this card: it fails an active filter;
 * - `null` = unknown: it passes, so the card stays visible;
 * - slider bounds are inclusive.
 */
import type { Bounds } from '@/shared/lib/url-state';

/** Any of `selected`; an empty selection passes everything. */
export function anyOf<T>(selected: readonly T[], value: T | null | undefined): boolean {
  if (selected.length === 0 || value === null) return true;
  return value !== undefined && selected.includes(value);
}

/** A card with several values (one per attack, rule…) passes when any of them does. */
export function anyOfMany<T>(selected: readonly T[], values: readonly (T | null)[]): boolean {
  if (selected.length === 0) return true;
  return values.some((value) => value === null || selected.includes(value));
}

/** Inclusive bounds; an open side doesn't limit. */
export function within(bounds: Bounds, value: number | null | undefined): boolean {
  if (bounds.min === undefined && bounds.max === undefined) return true;
  if (value === null) return true;
  if (value === undefined) return false;
  return (
    (bounds.min === undefined || value >= bounds.min) &&
    (bounds.max === undefined || value <= bounds.max)
  );
}

/** Checks a value against a single-sided slider; `undefined` limit = inactive. */
export const atLeast = (min: number | undefined, value: number | null | undefined) =>
  within(min === undefined ? {} : { min }, value);
export const atMost = (max: number | undefined, value: number | null | undefined) =>
  within(max === undefined ? {} : { max }, value);

/**
 * Compile-time check that `values` lists every member of `T` (a schema enum), so a schema
 * change that adds an option breaks the build instead of silently hiding cards.
 */
export function every<T extends string | number>() {
  return <const A extends readonly T[]>(
    values: A &
      ([Exclude<T, A[number]>] extends [never] ? unknown : { missing: Exclude<T, A[number]> }),
  ): A => values;
}
