import { describe, expect, it } from 'vitest';
import { CARD_TYPES } from '@/shared/lib/card-types';
import {
  emptyValues,
  readParams,
  writeParams,
  type Field,
  type Fields,
} from '@/shared/lib/url-state';
import { commonFields, createArchiveMemory, rememberFilters, tabSearch, typeFields } from '.';

/** A non-empty canonical value for any field. */
function sample(field: Field): unknown {
  switch (field.kind) {
    case 'list':
      return field.options.slice(0, 2);
    case 'tags':
      return ['cleric', 'thief'];
    case 'min':
      return field.min + 1;
    case 'max':
      return field.max - 1;
    case 'range':
      return { min: field.min + 1, max: field.max - 1 };
    case 'choice':
      return field.options.find((o) => o !== field.fallback);
    case 'text':
      return 'Black Knight';
  }
}

const samples = (fields: Fields) =>
  Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, sample(field)]));

const read = (fields: Fields, search: string) => readParams(fields, new URLSearchParams(search));

describe('filters → URL → filters round trip', () => {
  it.each(CARD_TYPES)('%s: every filter active, plus set, search and sort', (type) => {
    const fields = { ...commonFields, ...typeFields[type] };
    const values = samples(fields);
    const params = writeParams(fields, values);
    expect(readParams(fields, params)).toEqual(values);
    expect(writeParams(fields, readParams(fields, params)).toString()).toBe(params.toString());
  });

  it.each(CARD_TYPES)('%s: no filters writes no params and reads back empty', (type) => {
    const fields = { ...commonFields, ...typeFields[type] };
    expect(writeParams(fields, emptyValues(fields)).toString()).toBe('');
    expect(read(fields, '')).toEqual(emptyValues(fields));
  });

  it.each(CARD_TYPES)('%s: no param is used twice', (type) => {
    const fields: Fields = { ...commonFields, ...typeFields[type] };
    const params = Object.values(fields).map((f) => f.param);
    expect(new Set([...params, 'card']).size).toBe(params.length + 1);
  });
});

describe('each type keeps its own filters', () => {
  it('switching tabs restores that tab’s filters and carries set, search and sort', () => {
    const memory = createArchiveMemory();
    rememberFilters(memory, 'treasure', new URLSearchParams('set=tog&deck=starter&card=x'));
    rememberFilters(memory, 'enemy', new URLSearchParams('set=tog&threat=2-5'));

    const onEnemies = new URLSearchParams('set=sc&q=hollow&threat=2-5&card=x');
    expect(tabSearch(memory, 'treasure', onEnemies)).toBe('set=sc&q=hollow&deck=starter');
    expect(tabSearch(memory, 'enemy', new URLSearchParams('deck=starter'))).toBe('threat=2-5');
    expect(tabSearch(memory, 'boss', onEnemies)).toBe('set=sc&q=hollow');
  });
});
