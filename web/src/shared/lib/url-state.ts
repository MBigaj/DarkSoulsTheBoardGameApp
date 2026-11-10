/**
 * Shareable UI state in URL search params. A page describes its state as a record of fields;
 * `readParams` and `writeParams` turn that into params and back. Writing touches only the
 * fields' own params, so others (`?card=`) survive.
 *
 * Every value is canonical: options in declared order, no duplicates, numbers clamped, and a
 * value at its "no limit" end dropped. So `read(write(v))` equals `v` for any canonical `v`.
 */

/** Pills and checks: any of the declared options. */
export type ListField<T extends string | number = string | number> = {
  kind: 'list';
  param: string;
  options: readonly T[];
};
/** Open set of slugs (e.g. class ids from the data), sorted. */
export type TagsField = { kind: 'tags'; param: string };
/** Single slider with a lower bound; no limit at `min`. */
export type MinField = { kind: 'min'; param: string; min: number; max: number };
/** Single slider with an upper bound; no limit at `max`. */
export type MaxField = { kind: 'max'; param: string; min: number; max: number };
/** Min–max slider pair, `?threat=2-8` (either side may be open: `2-`, `-8`). */
export type RangeField = { kind: 'range'; param: string; min: number; max: number };
/** One of several options; `fallback` is the default and isn't written. */
export type ChoiceField<T extends string = string> = {
  kind: 'choice';
  param: string;
  options: readonly T[];
  fallback: T;
};
/** Free text (search), trimmed; empty isn't written. */
export type TextField = { kind: 'text'; param: string };

export type Field =
  ListField | TagsField | MinField | MaxField | RangeField | ChoiceField | TextField;
export type Fields = Record<string, Field>;

/** Inclusive bounds; an absent side is open. */
export type Bounds = { min?: number; max?: number };

export type FieldValue<F extends Field> =
  F extends ListField<infer T>
    ? T[]
    : F extends TagsField
      ? string[]
      : F extends RangeField
        ? Bounds
        : F extends ChoiceField<infer T>
          ? T
          : F extends TextField
            ? string
            : number | undefined;

export type Values<S extends Fields> = { [K in keyof S]: FieldValue<S[K]> };

// Builders keep option literals, so `Values` is precise.
export const list = <const T extends string | number>(
  param: string,
  options: readonly T[],
): ListField<T> => ({ kind: 'list', param, options });
export const tags = (param: string): TagsField => ({ kind: 'tags', param });
export const atLeast = (param: string, min: number, max: number): MinField => ({
  kind: 'min',
  param,
  min,
  max,
});
export const atMost = (param: string, min: number, max: number): MaxField => ({
  kind: 'max',
  param,
  min,
  max,
});
export const range = (param: string, min: number, max: number): RangeField => ({
  kind: 'range',
  param,
  min,
  max,
});
export const choice = <const T extends string>(
  param: string,
  options: readonly T[],
  fallback: NoInfer<T>,
): ChoiceField<T> => ({ kind: 'choice', param, options, fallback });
export const text = (param: string): TextField => ({ kind: 'text', param });

const SLUG = /^[a-z0-9-]+$/;
const INT = /^\d+$/;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const int = (token: string): number | undefined => (INT.test(token) ? Number(token) : undefined);
const tokens = (raw: string) =>
  raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

function inOrder<T>(options: readonly T[], picked: readonly T[]): T[] {
  return options.filter((option) => picked.includes(option));
}

function canonicalBounds(field: RangeField, bounds: Bounds): Bounds {
  let lo = bounds.min === undefined ? undefined : clamp(bounds.min, field.min, field.max);
  let hi = bounds.max === undefined ? undefined : clamp(bounds.max, field.min, field.max);
  if (lo !== undefined && hi !== undefined && lo > hi) [lo, hi] = [hi, lo];
  const out: Bounds = {};
  if (lo !== undefined && lo !== field.min) out.min = lo;
  if (hi !== undefined && hi !== field.max) out.max = hi;
  return out;
}

/** The value a field has when nothing is chosen. */
export function emptyValue<F extends Field>(field: F): FieldValue<F> {
  switch (field.kind) {
    case 'list':
    case 'tags':
      return [] as unknown as FieldValue<F>;
    case 'range':
      return {} as FieldValue<F>;
    case 'choice':
      return field.fallback as FieldValue<F>;
    case 'text':
      return '' as FieldValue<F>;
    case 'min':
    case 'max':
      return undefined as FieldValue<F>;
  }
}

export function emptyValues<S extends Fields>(fields: S): Values<S> {
  const out = {} as Record<string, unknown>;
  for (const [key, field] of Object.entries(fields)) out[key] = emptyValue(field);
  return out as Values<S>;
}

/** Parses one param; anything malformed or unknown is dropped, never thrown. */
function readField(field: Field, raw: string | null): unknown {
  if (raw === null) return emptyValue(field);
  switch (field.kind) {
    case 'list': {
      const picked = tokens(raw).flatMap((t) => field.options.filter((o) => String(o) === t));
      return inOrder(field.options, picked);
    }
    case 'tags':
      return [...new Set(tokens(raw).filter((t) => SLUG.test(t)))].sort();
    case 'min': {
      const n = int(raw.trim());
      return n === undefined || clamp(n, field.min, field.max) === field.min
        ? undefined
        : clamp(n, field.min, field.max);
    }
    case 'max': {
      const n = int(raw.trim());
      return n === undefined || clamp(n, field.min, field.max) === field.max
        ? undefined
        : clamp(n, field.min, field.max);
    }
    case 'range': {
      const [lo = '', hi = '', ...rest] = raw.split('-').map((t) => t.trim());
      if (rest.length > 0) return {};
      return canonicalBounds(field, { min: int(lo), max: int(hi) });
    }
    case 'choice':
      return field.options.find((o) => o === raw) ?? field.fallback;
    case 'text':
      return raw.trim();
  }
}

/** Param text for a value, or null when the field is at its empty value. */
function writeField(field: Field, value: unknown): string | null {
  switch (field.kind) {
    case 'list': {
      const picked = inOrder(field.options, value as readonly (string | number)[]);
      return picked.length > 0 ? picked.join(',') : null;
    }
    case 'tags': {
      const picked = [...new Set((value as readonly string[]).filter((t) => SLUG.test(t)))];
      return picked.length > 0 ? picked.sort().join(',') : null;
    }
    case 'min':
    case 'max': {
      if (value === undefined) return null;
      const n = clamp(value as number, field.min, field.max);
      return n === (field.kind === 'min' ? field.min : field.max) ? null : String(n);
    }
    case 'range': {
      const { min, max } = canonicalBounds(field, value as Bounds);
      if (min === undefined && max === undefined) return null;
      return `${min === undefined ? '' : String(min)}-${max === undefined ? '' : String(max)}`;
    }
    case 'choice':
      return value === field.fallback || !field.options.includes(value as string)
        ? null
        : (value as string);
    case 'text': {
      const trimmed = (value as string).trim();
      return trimmed === '' ? null : trimmed;
    }
  }
}

export function readParams<S extends Fields>(fields: S, params: URLSearchParams): Values<S> {
  const out = {} as Record<string, unknown>;
  for (const [key, field] of Object.entries(fields))
    out[key] = readField(field, params.get(field.param));
  return out as Values<S>;
}

/** A copy of `params` with the fields' params replaced; other params are kept. */
export function writeParams<S extends Fields>(
  fields: S,
  values: Partial<Values<S>>,
  params: URLSearchParams = new URLSearchParams(),
): URLSearchParams {
  const out = new URLSearchParams(params);
  for (const [key, field] of Object.entries(fields)) {
    if (!(key in values)) continue;
    const written = writeField(field, values[key]);
    if (written === null) out.delete(field.param);
    else out.set(field.param, written);
  }
  return out;
}

/** Only the fields' own params, e.g. to remember one tab's filters. */
export function pickParams(fields: Fields, params: URLSearchParams): URLSearchParams {
  const out = new URLSearchParams();
  for (const field of Object.values(fields)) {
    const value = params.get(field.param);
    if (value !== null) out.set(field.param, value);
  }
  return out;
}

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * Remembers a search string per key for the session (e.g. each archive tab's filters).
 * Uses `storage` when it works and falls back to memory, since storage can throw or be empty.
 */
export function createParamMemory(prefix: string, storage?: KeyValueStore) {
  const local = new Map<string, string>();
  return {
    save(key: string, params: URLSearchParams): void {
      const value = params.toString();
      local.set(key, value);
      try {
        storage?.setItem(`${prefix}:${key}`, value);
      } catch {
        // Memory still has it.
      }
    },
    load(key: string): URLSearchParams {
      let stored: string | null = null;
      try {
        stored = storage?.getItem(`${prefix}:${key}`) ?? null;
      } catch {
        // Fall back to memory.
      }
      return new URLSearchParams(stored ?? local.get(key) ?? '');
    },
  };
}

export type ParamMemory = ReturnType<typeof createParamMemory>;
