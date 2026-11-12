import { describe, expect, it } from 'vitest';
import type { CardType } from '@/shared/api/types';
import { emptyValues } from '@/shared/lib/url-state';
import { fixture, fixtureCards } from '@/test/fixture-cards';
import { commonFields, filterCards, typeFields, type CommonFilters, type TypeFilters } from '.';
import { matchesTreasure } from './treasure';

const noCommon = emptyValues(commonFields);

/** `_id`s (minus the `{set}-{type}-` prefix) of fixture cards of `type` passing the filters. */
function pass<T extends CardType>(
  type: T,
  filters: Partial<TypeFilters<T>>,
  common: Partial<CommonFilters> = {},
): string[] {
  const all = { ...emptyValues(typeFields[type]), ...filters } as TypeFilters<T>;
  return filterCards(type, fixtureCards, { ...noCommon, ...common }, all).map((card) =>
    card._id.replace(`-${type}-`, ':'),
  );
}

const ALL_TREASURE = [
  'pwa:black-leather-armour',
  'pwa:crystal-hail',
  'pwa:painting-guardians-curved-sword',
  'shared:ember',
  'shared:fireball',
  'tog:archdeacon-robe',
  'tog:bandit-knife',
  'tog:blue-titanite',
  'tog:dragon-tooth',
];

describe('treasure filters', () => {
  it('nothing active passes every card, and only cards of the type', () => {
    expect(pass('treasure', {})).toEqual(ALL_TREASURE);
  });

  it.each<[string, Partial<TypeFilters<'treasure'>>, string[]]>([
    // any of the options within one filter
    ['deck: starter', { deck: ['starter'] }, ['tog:bandit-knife']],
    [
      'rarity: boss drop is a rarity, any of with legendary',
      { rarity: ['legendary', 'boss'] },
      ['tog:blue-titanite', 'tog:dragon-tooth'],
    ],
    [
      'class: thief or cleric',
      { class: ['cleric', 'thief'] },
      ['tog:archdeacon-robe', 'tog:bandit-knife'],
    ],
    ['hands: two-handed', { hands: [2] }, ['tog:dragon-tooth']],
    ['status: bleed', { conditions: ['bleed'] }, ['pwa:painting-guardians-curved-sword']],
    // Checkboxes: every ticked option.
    [
      'features: node attack',
      { features: ['nodeAttack'] },
      ['shared:fireball', 'tog:dragon-tooth'],
    ],
    [
      'features: move (also the shift after the dice)',
      { features: ['move'] },
      ['pwa:painting-guardians-curved-sword'],
    ],
    ['features: node attack and move: no card has both', { features: ['nodeAttack', 'move'] }, []],
    [
      'defence: has block dice',
      { defence: ['block'] },
      ['pwa:black-leather-armour', 'tog:archdeacon-robe', 'tog:dragon-tooth'],
    ],
  ])('%s', (_name, filters, expected) => {
    expect(pass('treasure', filters)).toEqual(expected);
  });

  it('a field that does not apply hides the card while its filter is active', () => {
    // Starter cards have no rarity, generic cards no class, armour no hands or range.
    expect(pass('treasure', { rarity: ['common', 'rare', 'legendary', 'boss'] })).not.toContain(
      'tog:bandit-knife',
    );
    // A boss drop only passes as "Boss drop", whatever else is printed.
    expect(pass('treasure', { rarity: ['common', 'rare', 'legendary'] })).not.toContain(
      'tog:blue-titanite',
    );
    expect(pass('treasure', { class: ['cleric'] })).toEqual(['tog:archdeacon-robe']);
    expect(pass('treasure', { hands: [1, 2] })).not.toContain('tog:archdeacon-robe');
    expect(pass('treasure', { range: 1 })).not.toContain('pwa:black-leather-armour');
    // No attacks at all: every attack filter hides the card.
    for (const filters of [
      { dice: ['black'] },
      { damageType: ['physical', 'magical'] },
      { conditions: ['bleed', 'poison', 'frostbite', 'stagger'] },
      { features: ['nodeAttack', 'push', 'shaft', 'repeat', 'move'] },
    ] satisfies Partial<TypeFilters<'treasure'>>[]) {
      expect(pass('treasure', filters)).not.toContain('shared:ember');
    }
  });

  it('null (unknown) keeps the card visible', () => {
    // Dragon Tooth's third attack has damageType null, so a "magical" filter keeps it.
    expect(pass('treasure', { damageType: ['magical'] })).toEqual([
      'pwa:crystal-hail',
      'shared:fireball',
      'tog:dragon-tooth',
    ]);
    const ember = fixture('treasure', 'shared-treasure-ember');
    const unknownBlock = { ...ember, defence: { ...ember.defence, block: null } };
    const filters = { ...emptyValues(typeFields.treasure), defence: ['block' as const] };
    expect(matchesTreasure(ember, filters)).toBe(false); // {} = no block dice
    expect(matchesTreasure(unknownBlock, filters)).toBe(true);
    // Both boxes ticked: unknown block passes, but no resist dice still fails.
    const both = { ...filters, defence: ['block' as const, 'resist' as const] };
    expect(matchesTreasure(unknownBlock, both)).toBe(false);
    const unknownBlockWithResist = {
      ...unknownBlock,
      defence: { ...unknownBlock.defence, resist: { black: 1 } },
    };
    expect(matchesTreasure(unknownBlockWithResist, both)).toBe(true);
  });

  it('attack dice: the card uses every ticked die, on any of its attacks', () => {
    expect(pass('treasure', { dice: ['blue', 'orange'] })).toEqual(['tog:dragon-tooth']);
    expect(pass('treasure', { dice: ['black', 'orange'] })).toEqual(['shared:fireball']);
    expect(pass('treasure', { dice: ['black', 'blue'] })).toEqual([]);
  });

  it('slider bounds are inclusive', () => {
    // max STR 17: Archdeacon Robe needs exactly 17.
    expect(pass('treasure', { strength: 17 })).toContain('tog:archdeacon-robe');
    expect(pass('treasure', { strength: 16 })).not.toContain('tog:archdeacon-robe');
    expect(pass('treasure', { dodge: 2 })).toEqual(['pwa:black-leather-armour']);
    expect(pass('treasure', { upgradeSlots: 2 })).toEqual([
      'pwa:painting-guardians-curved-sword',
      'tog:archdeacon-robe',
    ]);
  });

  it('min range: "infinite" counts as the maximum', () => {
    expect(pass('treasure', { range: 3 })).toEqual(['pwa:crystal-hail']);
    expect(pass('treasure', { range: 2 })).toEqual(['pwa:crystal-hail', 'shared:fireball']);
  });

  it('separate filters combine with all of', () => {
    expect(pass('treasure', { deck: ['treasure'], hands: [1], damageType: ['magical'] })).toEqual([
      'pwa:crystal-hail',
      'shared:fireball',
    ]);
    expect(pass('treasure', { class: ['cleric'], hands: [1] })).toEqual([]);
  });
});

describe('enemy and boss filters', () => {
  it('min–max sliders are inclusive at both ends', () => {
    expect(pass('enemy', { threat: { min: 1, max: 1 } })).toEqual(['tog:giant-skeleton-archer']);
    expect(pass('enemy', { threat: { min: 2 } })).toEqual(['tog:skeleton-beast']);
    expect(pass('enemy', { health: { max: 5 } })).toHaveLength(2);
    expect(pass('enemy', { health: { max: 4 } })).toEqual([]);
    expect(pass('boss', { health: { min: 30, max: 30 } })).toEqual(['tog:gravelord-nito']);
  });

  it('boss type and stats combine with all of', () => {
    expect(pass('boss', { tier: ['main'] })).toEqual(['tog:gravelord-nito']);
    expect(pass('boss', { tier: ['mini'] })).toEqual([]);
    expect(pass('boss', { tier: ['main'], threat: { max: 9 } })).toEqual([]);
  });
});

describe('encounter filters', () => {
  it.each<[string, Partial<TypeFilters<'encounter'>>, string[]]>([
    ['level I', { level: [1] }, ['sc:dark-alleyway']],
    ['level Boss = has a boss', { level: ['boss'] }, ['tog:gravelord-nito']],
    ['level III or Boss', { level: [3, 'boss'] }, ['tog:gravelord-nito', 'tog:lakeview-refuge']],
    ['2 or 3 tiles', { tiles: [2, 3] }, ['tog:gravelord-nito', 'tog:lakeview-refuge']],
    ['traps', { includes: ['traps'] }, ['tog:lakeview-refuge']],
    ['chests (in any setup role)', { includes: ['chests'] }, ['sc:dark-alleyway']],
    ['checkboxes: traps and trial', { includes: ['traps', 'trial'] }, ['tog:lakeview-refuge']],
    ['checkboxes: chests and trial: none has both', { includes: ['chests', 'trial'] }, []],
    ['special rule: darkness', { keywords: ['darkness'] }, ['tog:lakeview-refuge']],
    ['no card has the rule', { keywords: ['timer'] }, []],
    ['all of: level III and a chest', { level: [3], includes: ['chests'] }, []],
  ])('%s', (_name, filters, expected) => {
    expect(pass('encounter', filters)).toEqual(expected);
  });
});

describe('event and behaviour filters', () => {
  it('event type', () => {
    expect(pass('event', { eventType: ['rendezvous'] })).toEqual([
      'shared:martial-bonfire-ascetic',
    ]);
  });

  it('behaviour decks have no filters: every card passes', () => {
    expect(pass('behaviour', {})).toEqual(['sc:gliding-stab-hammer-smash', 'tog:heavy-slash']);
  });
});

describe('core set and search', () => {
  it('a shared card passes when any set it ships in is ticked', () => {
    expect(pass('event', {}, { sets: ['pwa'] })).toEqual([
      'pwa:fleeting-glory',
      'shared:martial-bonfire-ascetic',
    ]);
    expect(pass('treasure', {}, { sets: ['sc'] })).toEqual(['shared:ember', 'shared:fireball']);
    // Fireball ships in SC and ToG only.
    expect(pass('treasure', {}, { sets: ['pwa'] })).not.toContain('shared:fireball');
  });

  it('search matches name or ID, case-insensitive, combined with the type filters', () => {
    expect(pass('treasure', {}, { q: '  FIRE ' })).toEqual(['shared:fireball']);
    expect(pass('treasure', {}, { q: 'tog-treasure-b' })).toEqual([
      'tog:bandit-knife',
      'tog:blue-titanite',
    ]);
    expect(pass('treasure', { rarity: ['boss'] }, { q: 'tog-treasure-b' })).toEqual([
      'tog:blue-titanite',
    ]);
  });
});
