import { describe, expect, it } from 'vitest';
import {
  atLeast,
  createParamMemory,
  atMost,
  choice,
  list,
  range,
  readParams,
  tags,
  text,
  writeParams,
  type Fields,
} from './url-state';

const read = (fields: Fields, search: string) => readParams(fields, new URLSearchParams(search));

describe('reading is lenient and canonical', () => {
  const fields = {
    level: list('level', [1, 2, 3, 'boss'] as const),
    class: tags('class'),
    range: atLeast('range', 0, 3),
    str: atMost('str', 0, 40),
    threat: range('threat', 0, 10),
    sort: choice('sort', ['id', 'name'], 'id'),
    q: text('q'),
  };

  it.each<[string, string, Record<string, unknown>]>([
    [
      'options in declared order, no duplicates, unknown dropped',
      'level=boss,1,x,1',
      { level: [1, 'boss'] },
    ],
    ['tags: slugs only, sorted', 'class=thief,Cleric,cleric,a b', { class: ['cleric', 'thief'] }],
    ['numbers are clamped', 'range=9&str=99', { range: 3 }],
    [
      '"no limit" ends are dropped',
      'range=0&str=40&threat=0-10',
      { range: undefined, str: undefined, threat: {} },
    ],
    ['open-ended ranges', 'threat=3-', { threat: { min: 3 } }],
    ['open-ended ranges, upper side', 'threat=-7', { threat: { max: 7 } }],
    ['reversed range is swapped', 'threat=8-2', { threat: { min: 2, max: 8 } }],
    [
      'malformed numbers and ranges are ignored',
      'range=two&threat=1-2-3',
      { range: undefined, threat: {} },
    ],
    ['unknown choice falls back', 'sort=random', { sort: 'id' }],
    ['search is trimmed', 'q=%20nito%20', { q: 'nito' }],
  ])('%s', (_name, search, expected) => {
    expect(read(fields, search)).toMatchObject(expected);
  });

  it('writing touches only its own params, so ?card= survives', () => {
    const params = writeParams(
      fields,
      { level: [2], q: '' },
      new URLSearchParams('card=tog-boss-gravelord-nito&q=old&level=1'),
    );
    expect(params.toString()).toBe('card=tog-boss-gravelord-nito&level=2');
  });
});

describe('createParamMemory', () => {
  it('falls back to memory when session storage throws', () => {
    const denied = () => {
      throw new Error('denied');
    };
    const memory = createParamMemory('test', { getItem: denied, setItem: denied });
    memory.save('event', new URLSearchParams('kind=immediate'));
    expect(memory.load('event').toString()).toBe('kind=immediate');
  });

  it('reads what another page load saved to storage', () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: store.set.bind(store),
    };
    createParamMemory('test', storage).save('boss', new URLSearchParams('tier=main'));
    expect(createParamMemory('test', storage).load('boss').toString()).toBe('tier=main');
    expect(createParamMemory('test', storage).load('enemy').toString()).toBe('');
  });
});
