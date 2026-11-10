import { describe, expect, it } from 'vitest';
import type {
  RawBehaviour,
  RawBoss,
  RawEncounter,
  RawEnemy,
  RawEvent,
  RawTreasure,
} from '../generated';
import { normalizeCard } from './cards';

const treasure: RawTreasure = {
  _id: 'tog-treasure-test',
  set: 'tog',
  type: 'treasure',
  name: 'Test Blade',
  art: null,
  deck: 'treasure',
  rarity: 'common',
  equip: 'hand',
  hands: 1,
  requirements: { strength: 10, dexterity: 0, intelligence: 0, faith: 0 },
  defence: { block: null, resist: {}, dodge: 0 },
  upgradeSlots: 0,
  attacks: [
    { staminaCost: 0, dice: { black: 1 }, damageType: 'physical' },
    { staminaCost: 2, dice: {}, damageType: null, nodeAttack: true, conditions: ['bleed'] },
  ],
  review: { source: 'scan', confidence: 'low', flags: [{ field: 'name', note: 'blurry' }] },
};

const action: RawEnemy['behaviour'][number] = { kind: 'attack', target: 'nearest', damage: 3 };

const enemy: RawEnemy = {
  _id: 'tog-enemy-test',
  set: 'tog',
  type: 'enemy',
  name: 'Test Hollow',
  art: null,
  models: 1,
  threat: 1,
  health: 1,
  range: 'infinite',
  block: 0,
  resist: 0,
  dodgeDifficulty: 1,
  behaviour: [action, { ...action, push: true, conditions: ['stagger'] }],
};

const boss: RawBoss = {
  _id: 'tog-boss-test',
  set: 'tog',
  type: 'boss',
  name: 'Test Boss',
  art: null,
  tier: 'mini',
  threat: 5,
  health: 20,
  heatUp: 10,
  block: 1,
  resist: 1,
  deckSize: 5,
};

const behaviour: RawBehaviour = {
  _id: 'tog-behaviour-test',
  set: 'tog',
  type: 'behaviour',
  name: 'Test Swing',
  art: null,
  boss: 'tog-boss-test',
  range: 1,
  dodgeDifficulty: 1,
  behaviour: [action],
};

const encounter: RawEncounter = {
  _id: 'tog-encounter-test',
  set: 'tog',
  type: 'encounter',
  name: 'Test Hall',
  art: null,
  level: 1,
  objective: 'Kill all enemies.',
  goals: [{ kind: 'kill', target: 'all' }],
  rewards: [
    { type: 'souls', amount: 2, plusPlayers: true },
    { type: 'souls', amount: 1 },
  ],
  trial: { objective: 'Win fast.', rewards: [{ type: 'souls', amount: 1 }] },
  tiles: [
    { tile: 1, at: [0, 0], trapped: true, setup: { primarySpawn: ['tog-enemy-test'] } },
    { tile: 2, at: [0, 1] },
  ],
};

const combined: RawBehaviour = {
  _id: 'sc-behaviour-test-combined',
  set: 'sc',
  type: 'behaviour',
  name: 'Top / Bottom',
  art: null,
  parts: [
    {
      name: 'Top',
      boss: 'sc-boss-a',
      dodgeDifficulty: 1,
      behaviour: [action],
      arcs: { front: 'neutral', left: 'neutral', right: 'neutral', back: 'weak' },
    },
    {
      name: 'Bottom',
      boss: 'sc-boss-b',
      heatUp: true,
      dodgeDifficulty: 2,
      behaviour: [],
      arcs: { front: 'attack', left: 'neutral', right: 'neutral', back: 'neutral' },
    },
  ],
};

const event: RawEvent = {
  _id: 'tog-event-test',
  set: 'tog',
  type: 'event',
  name: 'Test Event',
  art: null,
  eventType: 'immediate',
  text: 'Nothing happens.',
};

describe('normalizeCard: defaults the store omits are filled', () => {
  it('treasure: absent lists become empty, absent flags false', () => {
    const card = normalizeCard({ ...treasure, attacks: undefined });
    expect(card).toMatchObject({ attacks: [], abilities: [] });

    const [plain, special] = (normalizeCard(treasure) as { attacks: object[] }).attacks;
    expect(plain).toMatchObject({ nodeAttack: false, shaft: false, conditions: [], keywords: [] });
    expect(special).toMatchObject({ nodeAttack: true, conditions: ['bleed'] });
  });

  it('enemy and behaviour actions: absent flags false, absent conditions empty', () => {
    const { behaviour: actions, keywords } = normalizeCard(enemy) as {
      behaviour: object[];
      keywords: string[];
    };
    expect(keywords).toEqual([]);
    expect(actions[0]).toMatchObject({
      leap: false,
      push: false,
      nodeAttack: false,
      area: false,
      conditions: [],
    });
    expect(actions[1]).toMatchObject({ push: true, conditions: ['stagger'] });
    expect(normalizeCard(behaviour)).toMatchObject({ heatUp: false, parts: [] });
  });

  it('combined behaviour: no own actions, each part normalized', () => {
    expect(normalizeCard(combined)).toMatchObject({
      behaviour: [],
      heatUp: false,
      parts: [
        { heatUp: false, behaviour: [{ push: false, conditions: [] }] },
        { heatUp: true, behaviour: [] },
      ],
    });
  });

  it('boss: absent rules become empty', () => {
    expect(normalizeCard(boss)).toMatchObject({ rules: [] });
  });

  it('encounter: absent lists and flags filled on rules, tiles and rewards', () => {
    expect(normalizeCard(encounter)).toMatchObject({
      specialRules: [],
      rewards: [{ plusPlayers: true }, { plusPlayers: false }],
      trial: { plusPlayers: false, rewards: [{ plusPlayers: false }] },
      tiles: [
        {
          trapped: true,
          isolated: false,
          start: [],
          markers: [],
          setup: { primarySpawn: ['tog-enemy-test'] },
        },
        { trapped: false, isolated: false, start: [], markers: [], setup: {} },
      ],
    });
  });
});

describe('normalizeCard: null (unknown) is never replaced by a default', () => {
  it.each([
    ['treasure', treasure],
    ['enemy', enemy],
    ['boss', boss],
    ['behaviour', behaviour],
    ['encounter', encounter],
    ['event', event],
  ] as const)('%s keeps art: null', (_type, raw) => {
    expect(normalizeCard(raw).art).toBeNull();
  });

  it('treasure keeps a null damage type and null defence dice', () => {
    const card = normalizeCard(treasure) as {
      attacks: { damageType: unknown }[];
      defence: { block: unknown; resist: unknown };
    };
    expect(card.attacks[1]?.damageType).toBeNull();
    expect(card.defence.block).toBeNull();
    expect(card.defence.resist).toEqual({});
  });
});

describe('normalizeCard: fields that do not apply stay absent', () => {
  it('a treasure without hands or range gets neither', () => {
    const armour = normalizeCard({ ...treasure, equip: 'armour', hands: undefined });
    expect('range' in armour).toBe(false);
    expect((armour as { hands?: number }).hands).toBeUndefined();
  });

  it('an encounter without a trial gets none', () => {
    expect('trial' in normalizeCard({ ...encounter, trial: undefined })).toBe(false);
  });

  it('data-prep review notes are dropped', () => {
    expect('review' in normalizeCard(treasure)).toBe(false);
  });
});
