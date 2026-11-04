import { describe, expect, it } from 'vitest';
import type { CardSummary, TreasureSummary } from '@/shared/api/types';
import { badgeLabel, compareById, displayCodes, statLine } from './format';

const common = { set: 'tog', name: 'Card', art: null } as const;

function treasure(
  requirements: TreasureSummary['requirements'],
  extra: Partial<TreasureSummary> = {},
): CardSummary {
  return {
    ...common,
    _id: 'tog-treasure-x',
    type: 'treasure',
    deck: 'treasure',
    rarity: 'common',
    equip: 'hand',
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
  it.each<[string, CardSummary, string]>([
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
      { ...common, _id: 'tog-encounter-x', type: 'encounter', level: 1, tileCount: 1 },
      'Level I · 1 tile',
    ],
    [
      'encounter, several tiles',
      { ...common, _id: 'tog-encounter-y', type: 'encounter', level: 3, tileCount: 3 },
      'Level III · 3 tiles',
    ],
    [
      'event',
      { ...common, _id: 'tog-event-x', type: 'event', eventType: 'rendezvous' },
      'Rendezvous',
    ],
    [
      'behaviour has none yet',
      { ...common, _id: 'tog-behaviour-x', type: 'behaviour', boss: 'tog-boss-x' },
      '',
    ],
  ])('%s', (_name, card, line) => {
    expect(statLine(card)).toBe(line);
  });
});

describe('badgeLabel', () => {
  it.each<[string, CardSummary, string]>([
    ['common treasure', treasure(req(0, 0, 0, 0)), 'Common'],
    ['legendary treasure', treasure(req(0, 0, 0, 0), { rarity: 'legendary' }), 'Legendary'],
    ['boss drop', treasure(req(0, 0, 0, 0), { deck: 'boss', rarity: undefined }), 'Boss drop'],
    [
      'starter (no rarity)',
      treasure(req(0, 0, 0, 0), { deck: 'starter', rarity: undefined }),
      'Treasure',
    ],
    [
      'mini boss',
      { ...common, _id: 'tog-boss-y', type: 'boss', tier: 'mini', threat: 5, health: 18 },
      'Mini boss',
    ],
    ['event', { ...common, _id: 'tog-event-x', type: 'event', eventType: 'immediate' }, 'Event'],
  ])('%s', (_name, card, label) => {
    expect(badgeLabel(card)).toBe(label);
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
  ] as const;

  it('numbers from 001 in _id order, restarting for each set and type', () => {
    expect(Object.fromEntries(displayCodes(cards))).toEqual({
      'tog-treasure-black-knight-shield': 'TOG-001',
      'tog-treasure-blackbird': 'TOG-002',
      'tog-treasure-fireball': 'TOG-003',
      'sc-treasure-axe': 'SC-001',
      'sc-treasure-zweihander': 'SC-002',
      'tog-enemy-skeleton-beast': 'TOG-001',
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
