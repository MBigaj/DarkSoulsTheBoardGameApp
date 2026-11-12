import { describe, expect, it } from 'vitest';
import type { CardType } from '@/shared/api/types';
import { displayCodes } from '@/shared/lib/format';
import { emptyValues } from '@/shared/lib/url-state';
import { fixtureCards } from '@/test/fixture-cards';
import { availableOptions, cardsOfType, overview, setCounts, tabCounts } from './catalog';
import { railFacets } from './rail';
import { commonFields, typeFields, type CommonFilters, type TypeFilters } from './filters';

const common = (extra: Partial<CommonFilters> = {}): CommonFilters => ({
  ...emptyValues(commonFields),
  ...extra,
});
const noFilters = <T extends CardType>(type: T) => emptyValues(typeFields[type]) as TypeFilters<T>;
const short = (cards: readonly { _id: string; type: string }[]) =>
  cards.map((card) => card._id.replace(`-${card.type}-`, ':'));

describe('overview', () => {
  it('one section per type: its total and the first 5 in _id order', () => {
    const sections = overview(fixtureCards, common());
    expect(sections.map((s) => [s.type, s.total])).toEqual([
      ['treasure', 9],
      ['enemy', 2],
      ['boss', 1],
      ['behaviour', 2],
      ['encounter', 3],
      ['event', 2],
    ]);
    expect(short(sections[0]?.items ?? [])).toEqual([
      'pwa:black-leather-armour',
      'pwa:crystal-hail',
      'pwa:painting-guardians-curved-sword',
      'shared:ember',
      'shared:fireball',
    ]);
  });

  it('applies set (shared cards included) and search, and nothing else', () => {
    const tog = overview(fixtureCards, common({ sets: ['tog'] }));
    expect(tog[0]?.total).toBe(6); // 4 ToG treasure + Ember and Fireball, shared with ToG
    expect(short(tog[0]?.items ?? [])).toEqual([
      'shared:ember',
      'shared:fireball',
      'tog:archdeacon-robe',
      'tog:bandit-knife',
      'tog:blue-titanite',
    ]);
    const search = overview(fixtureCards, common({ q: 'skeleton' }));
    expect(search.map((s) => s.total)).toEqual([0, 2, 0, 0, 0, 0]);
  });

  it('search also matches the display code shown on the tile', () => {
    const codes = displayCodes(fixtureCards);
    const sections = overview(fixtureCards, common({ q: 'tog-002' }), codes);
    // TOG-002 is the second ToG card of each type that has one.
    expect(sections.flatMap((s) => short(s.items))).toEqual([
      'tog:bandit-knife',
      'tog:skeleton-beast',
      'tog:lakeview-refuge',
    ]);
  });
});

describe('cardsOfType', () => {
  it('sorts by name A–Z when asked, by _id otherwise', () => {
    const byName = cardsOfType(fixtureCards, 'event', common({ sort: 'name' }));
    expect(byName.map((c) => c.name)).toEqual(['Fleeting Glory', 'Martial Bonfire Ascetic']);
    const treasure = cardsOfType(fixtureCards, 'treasure', common({ sort: 'name' }));
    expect(treasure.map((c) => c.name)).toEqual([...treasure.map((c) => c.name)].sort());
    expect(short(cardsOfType(fixtureCards, 'boss', common()))).toEqual(['tog:gravelord-nito']);
  });

  it('applies the type filters on top of set and search', () => {
    const filters = { ...noFilters('treasure'), deck: ['starter' as const] };
    expect(short(cardsOfType(fixtureCards, 'treasure', common(), filters))).toEqual([
      'tog:bandit-knife',
    ]);
    expect(cardsOfType(fixtureCards, 'treasure', common({ sets: ['pwa'] }), filters)).toEqual([]);
  });
});

describe('tabCounts', () => {
  it('All counts set and search; each type tab adds its own filters', () => {
    const starters = { ...noFilters('treasure'), deck: ['starter' as const] };
    const filtersOf = <T extends CardType>(type: T) =>
      (type === 'treasure' ? starters : noFilters(type)) as TypeFilters<T>;

    expect(tabCounts(fixtureCards, common(), filtersOf)).toEqual({
      all: 19,
      treasure: 1,
      enemy: 2,
      boss: 1,
      behaviour: 2,
      encounter: 3,
      event: 2,
    });
    const tog = tabCounts(fixtureCards, common({ sets: ['tog'], q: 'e' }), noFilters);
    expect(tog.event).toBe(1); // Martial Bonfire Ascetic: shared, ships in ToG
    expect(tog.all).toBe(
      tog.treasure + tog.enemy + tog.boss + tog.behaviour + tog.encounter + tog.event,
    );
  });
});

describe('setCounts', () => {
  it('a shared card counts under every set it ships in', () => {
    expect(setCounts(fixtureCards)).toEqual({ tog: 13, sc: 5, pwa: 6 });
    expect(setCounts(fixtureCards, 'treasure')).toEqual({ tog: 6, sc: 2, pwa: 4 });
  });
});

describe('availableOptions', () => {
  const facets = (type: CardType) => railFacets(type, ['cleric', 'deprived', 'thief', 'warrior']);
  const available = <T extends CardType>(
    type: T,
    extra: Partial<TypeFilters<T>>,
    commonExtra: Partial<CommonFilters> = {},
  ) => {
    const map = availableOptions(
      fixtureCards,
      type,
      common(commonExtra),
      { ...noFilters(type), ...extra },
      facets(type),
    );
    return (key: string) => [...(map.get(key) ?? [])];
  };

  it('a set leaves only the classes, rarities and slots that have cards in it', () => {
    const tog = available('treasure', {}, { sets: ['tog'] });
    expect(tog('class')).toEqual(['cleric', 'thief']); // Deprived is PWA, no Warrior card
    expect(tog('rarity')).toEqual(['common', 'rare', 'legendary', 'boss']);
    const pwa = available('treasure', {}, { sets: ['pwa'] });
    expect(pwa('rarity')).toEqual(['common', 'rare']); // no PWA legendary or boss drop fixture
    expect(pwa('class')).toEqual(['deprived']);
  });

  it('any of: each option is judged on its own, with the other filters applied', () => {
    // Starter decks have no rarity, so no rarity option would leave a card.
    expect(available('treasure', { deck: ['starter'] })('rarity')).toEqual([]);
    // Ticked options stay available, so they can be unticked.
    expect(available('treasure', { deck: ['starter'], rarity: ['rare'] })('rarity')).toEqual([
      'rare',
    ]);
  });

  it('every ticked: an option is available if adding it to the ticked ones leaves a card', () => {
    const withTraps = available('encounter', { includes: ['traps'] });
    expect(withTraps('includes')).toEqual(['traps', 'trial']); // Lakeview has both, no chest
    const dice = available('treasure', { dice: ['orange'] })('dice');
    expect(dice).toEqual(['black', 'blue', 'orange']); // Fireball black+orange, Dragon Tooth blue+orange
    expect(available('treasure', { dice: ['black', 'orange'] })('dice')).toEqual([
      'black',
      'orange',
    ]);
  });
});
