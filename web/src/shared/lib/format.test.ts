import { describe, expect, it } from 'vitest';
import type { Treasure } from '@/shared/api/types';
import { badge, compareById, displayCodes, statLine, type Badge, type TileCard } from './format';

const common = { set: 'tog', name: 'Card' } as const;

function treasure(
  requirements: Treasure['requirements'],
  extra: Partial<Pick<Treasure, 'deck' | 'rarity'>> = {},
): TileCard {
  return {
    ...common,
    _id: 'tog-treasure-x',
    type: 'treasure',
    deck: 'treasure',
    rarity: 'common',
    requirements,
    ...extra,
  };
}

const req = (strength: number, dexterity: number, intelligence: number, faith: number) => ({
  strength,
  dexterity,
  intelligence,
  faith,
});

describe('statLine', () => {
  it.each<[string, TileCard, string]>([
    // Edge cases first: zero requirements are left out; none at all says so.
    ['treasure, no requirements', treasure(req(0, 0, 0, 0)), 'No requirements'],
    ['treasure, one requirement', treasure(req(0, 0, 23, 0)), 'INT 23'],
    ['treasure, zeros in between', treasure(req(25, 0, 0, 15)), 'STR 25 · FAI 15'],
    [
      'treasure, all four in order',
      treasure(req(10, 12, 14, 16)),
      'STR 10 · DEX 12 · INT 14 · FAI 16',
    ],
    [
      'enemy, zero threat kept',
      { ...common, _id: 'tog-enemy-x', type: 'enemy', threat: 0, health: 1 },
      'Threat 0 · Health 1',
    ],
    [
      'main boss',
      { ...common, _id: 'tog-boss-x', type: 'boss', tier: 'main', threat: 9, health: 30 },
      'Main · Threat 9 · Health 30',
    ],
    [
      'mini boss',
      { ...common, _id: 'tog-boss-y', type: 'boss', tier: 'mini', threat: 5, health: 18 },
      'Mini · Threat 5 · Health 18',
    ],
    [
      'encounter, one tile',
      { ...common, _id: 'tog-encounter-x', type: 'encounter', level: 1, tiles: [{}] },
      '1 tile',
    ],
    [
      'encounter, several tiles',
      { ...common, _id: 'tog-encounter-y', type: 'encounter', level: 3, tiles: [{}, {}, {}] },
      '3 tiles',
    ],
    [
      'boss encounter, no level',
      { ...common, _id: 'tog-encounter-z', type: 'encounter', boss: 'tog-boss-x', tiles: [{}, {}] },
      '2 tiles',
    ],
    [
      'event',
      { ...common, _id: 'tog-event-x', type: 'event', eventType: 'rendezvous' },
      'Rendezvous',
    ],
  ])('%s', (_name, card, line) => {
    expect(statLine(card)).toBe(line);
  });
});

describe('statLine: behaviour cards name their boss', () => {
  const names: Record<string, string> = { 'sc-boss-o': 'Ornstein', 'sc-boss-s': 'Smough' };
  const nameOf = (id: string) => names[id];
  const behaviour = (extra: object): TileCard => ({
    ...common,
    _id: 'sc-behaviour-x',
    type: 'behaviour',
    heatUp: false,
    parts: [],
    ...extra,
  });
  const part = (boss: string, heatUp: boolean) =>
    ({ boss, heatUp }) as Extract<TileCard, { type: 'behaviour' }>['parts'][number];

  it.each<[string, TileCard, string]>([
    ['single card', behaviour({ boss: 'sc-boss-o' }), 'Ornstein'],
    ['heat-up card', behaviour({ boss: 'sc-boss-o', heatUp: true }), 'Ornstein · Heat up'],
    [
      'combined card: both bosses, heat up if a half is',
      behaviour({ parts: [part('sc-boss-o', false), part('sc-boss-s', true)] }),
      'Ornstein & Smough · Heat up',
    ],
    ['unknown boss id shows nothing', behaviour({ boss: 'sc-boss-gone' }), ''],
  ])('%s', (_name, card, line) => {
    expect(statLine(card, nameOf)).toBe(line);
  });
});

describe('badge', () => {
  it.each<[string, TileCard, Badge]>([
    ['common treasure', treasure(req(0, 0, 0, 0)), { label: 'Common', tone: 'common' }],
    [
      'rare treasure',
      treasure(req(0, 0, 0, 0), { rarity: 'rare' }),
      { label: 'Rare', tone: 'rare' },
    ],
    [
      'legendary treasure',
      treasure(req(0, 0, 0, 0), { rarity: 'legendary' }),
      { label: 'Legendary', tone: 'legendary' },
    ],
    [
      'boss drop wins over rarity',
      treasure(req(0, 0, 0, 0), { deck: 'boss', rarity: 'legendary' }),
      { label: 'Boss drop', tone: 'bossDrop' },
    ],
    [
      'starter: no rarity, type colour',
      treasure(req(0, 0, 0, 0), { deck: 'starter', rarity: undefined }),
      { label: 'Starter', tone: 'starter' },
    ],
    [
      'mini boss',
      { ...common, _id: 'tog-boss-y', type: 'boss', tier: 'mini', threat: 5, health: 18 },
      { label: 'Mini boss', tone: 'miniBoss' },
    ],
    [
      'main boss',
      { ...common, _id: 'tog-boss-z', type: 'boss', tier: 'main', threat: 10, health: 30 },
      { label: 'Main boss', tone: 'mainBoss' },
    ],
    [
      'event: the type',
      { ...common, _id: 'tog-event-x', type: 'event', eventType: 'immediate' },
      { label: 'Event' },
    ],
    [
      'heat-up behaviour',
      { ...common, _id: 'tog-behaviour-x', type: 'behaviour', heatUp: true, parts: [] },
      { label: 'Heat up', tone: 'heatUp' },
    ],
    [
      'plain behaviour',
      { ...common, _id: 'tog-behaviour-y', type: 'behaviour', heatUp: false, parts: [] },
      { label: 'Behaviour' },
    ],
    [
      'encounter: its level',
      { ...common, _id: 'tog-encounter-y', type: 'encounter', level: 2, tiles: [{}] },
      { label: 'Level II', tone: 'level2' },
    ],
    [
      'boss encounter',
      { ...common, _id: 'tog-encounter-x', type: 'encounter', boss: 'tog-boss-x', tiles: [{}] },
      { label: 'Boss', tone: 'bossEncounter' },
    ],
  ])('%s', (_name, card, expected) => {
    expect(badge(card)).toEqual(expected);
  });
});

describe('display codes and Card ID order', () => {
  const cards = [
    { _id: 'tog-treasure-fireball', set: 'tog', type: 'treasure' },
    { _id: 'sc-treasure-zweihander', set: 'sc', type: 'treasure' },
    { _id: 'tog-treasure-black-knight-shield', set: 'tog', type: 'treasure' },
    { _id: 'tog-treasure-blackbird', set: 'tog', type: 'treasure' },
    { _id: 'tog-enemy-skeleton-beast', set: 'tog', type: 'enemy' },
    { _id: 'sc-treasure-axe', set: 'sc', type: 'treasure' },
    { _id: 'tog-treasure-fireball', set: 'tog', type: 'treasure' }, // listed twice
    { _id: 'shared-treasure-ember', set: 'shared', type: 'treasure' },
  ] as const;

  it('numbers from 001 in _id order, restarting for each set and type', () => {
    expect(Object.fromEntries(displayCodes(cards))).toEqual({
      'tog-treasure-black-knight-shield': 'TOG-001',
      'tog-treasure-blackbird': 'TOG-002',
      'tog-treasure-fireball': 'TOG-003',
      'sc-treasure-axe': 'SC-001',
      'sc-treasure-zweihander': 'SC-002',
      'tog-enemy-skeleton-beast': 'TOG-001',
      'shared-treasure-ember': 'SH-001',
    });
  });

  it('pads to three digits', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      _id: `tog-event-e${String(i).padStart(2, '0')}`,
      set: 'tog' as const,
      type: 'event' as const,
    }));
    expect(displayCodes(many).get('tog-event-e11')).toBe('TOG-012');
  });

  it('Card ID sort is plain _id order (code units, not locale), matching the codes', () => {
    const sorted = [...cards].sort(compareById).map((c) => c._id);
    // "-" sorts before letters and digits, so black-knight-shield comes before blackbird.
    expect(sorted.indexOf('tog-treasure-black-knight-shield')).toBeLessThan(
      sorted.indexOf('tog-treasure-blackbird'),
    );
    expect(sorted).toEqual(cards.map((c) => c._id).sort());

    const codes = displayCodes(cards);
    const treasureCodes = sorted
      .filter((id) => id.startsWith('tog-treasure-'))
      .map((id) => codes.get(id));
    expect(treasureCodes).toEqual(['TOG-001', 'TOG-002', 'TOG-003', 'TOG-003']);
  });
});
