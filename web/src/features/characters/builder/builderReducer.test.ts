import { describe, expect, it } from 'vitest';
import {
  builderReducer,
  initialBuilder,
  parseBuilder,
  soulsSpent,
  type BuilderAction,
  type BuilderState,
} from './builderReducer';
import { DEFAULT_HEALTH } from './calculator';

const run = (...actions: BuilderAction[]) => actions.reduce(builderReducer, initialBuilder());
const active = (state: BuilderState) => {
  const slot = state.slots[state.active];
  if (!slot) throw new Error('no active slot');
  return slot;
};

describe('builderReducer: stat tiers and souls', () => {
  it('buying a tier buys every tier below it: 2 / 4 / 8 souls', () => {
    const t1 = run({ type: 'setTier', stat: 'strength', tier: 1 });
    expect(soulsSpent(active(t1).tiers)).toBe(2);
    const t3 = run({ type: 'setTier', stat: 'strength', tier: 3 });
    expect(active(t3).tiers.strength).toBe(3);
    expect(soulsSpent(active(t3).tiers)).toBe(14); // 2 + 4 + 8
  });

  it('souls add up across stats; a lower tier sells back down', () => {
    const state = run(
      { type: 'setTier', stat: 'strength', tier: 2 }, // 6
      { type: 'setTier', stat: 'faith', tier: 3 }, // 14
      { type: 'setTier', stat: 'dexterity', tier: 1 }, // 2
    );
    expect(soulsSpent(active(state).tiers)).toBe(22);
    const sold = builderReducer(state, { type: 'setTier', stat: 'faith', tier: 1 });
    expect(soulsSpent(active(sold).tiers)).toBe(10);
    const base = builderReducer(sold, { type: 'setTier', stat: 'strength', tier: 0 });
    expect(soulsSpent(active(base).tiers)).toBe(4);
  });

  it('Reset puts the active slot back to base, and only that slot', () => {
    const state = run(
      { type: 'setTier', stat: 'strength', tier: 3 },
      { type: 'selectSlot', slot: 2 },
      { type: 'setTier', stat: 'faith', tier: 2 },
      { type: 'reset' },
    );
    expect(soulsSpent(active(state).tiers)).toBe(0);
    expect(soulsSpent(state.slots[0]?.tiers ?? active(state).tiers)).toBe(14);
  });
});

describe('builderReducer: party', () => {
  it('a class goes on the selected slot; a new class starts from base', () => {
    const state = run(
      { type: 'selectSlot', slot: 1 },
      { type: 'setTier', stat: 'intelligence', tier: 2 },
      { type: 'setClass', classId: 'herald', kit: null },
    );
    expect(state.slots.map((s) => s.classId)).toEqual(['warrior', 'herald', 'cleric', 'thief']);
    expect(soulsSpent(active(state).tiers)).toBe(0);
  });

  it('picking the class it already has keeps the tiers', () => {
    const state = run(
      { type: 'setTier', stat: 'strength', tier: 1 },
      { type: 'setClass', classId: 'warrior', kit: null },
    );
    expect(soulsSpent(active(state).tiers)).toBe(2);
  });

  it('ignores a slot that does not exist', () => {
    expect(run({ type: 'selectSlot', slot: 4 }).active).toBe(0);
  });
});

describe('builderReducer: classes the store has', () => {
  const ids = ['cleric', 'herald', 'sorcerer', 'thief', 'warrior'];

  it('a slot with an unknown class gets a known one and base stats, in the state itself', () => {
    const saved: BuilderState = {
      active: 1,
      slots: [
        {
          classId: 'gone',
          tiers: { strength: 2, dexterity: 0, intelligence: 0, faith: 0 },
          gear: null,
          calc: null,
          heavilyDamaged: false,
        },
        ...initialBuilder().slots.slice(1),
      ],
      targetHealth: 5,
      targetIsBoss: false,
    };
    const state = builderReducer(saved, { type: 'syncClasses', ids });
    expect(state.slots[0]).toEqual({
      classId: 'warrior',
      tiers: initialBuilder().slots[0]?.tiers,
      gear: null,
      calc: null,
      heavilyDamaged: false,
    });
    expect(state.slots.slice(1)).toEqual(saved.slots.slice(1));
    expect(state.active).toBe(1);
  });

  it('falls back to the first class when the slot’s default isn’t in the store either', () => {
    const state = builderReducer(initialBuilder(), {
      type: 'syncClasses',
      ids: ['herald', 'thief'],
    });
    expect(state.slots.map((s) => s.classId)).toEqual(['herald', 'herald', 'herald', 'thief']);
  });

  it('changes nothing when every class is known, or no classes are listed', () => {
    const state = initialBuilder();
    expect(builderReducer(state, { type: 'syncClasses', ids })).toBe(state);
    expect(builderReducer(state, { type: 'syncClasses', ids: [] })).toBe(state);
  });
});

describe('parseBuilder (saved party)', () => {
  it('reads back what it saved', () => {
    const state = run({ type: 'selectSlot', slot: 3 }, { type: 'setTier', stat: 'faith', tier: 3 });
    expect(parseBuilder(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });

  it.each([
    ['not an object', 'party'],
    ['wrong slot count', { active: 0, slots: [] }],
    [
      'a tier out of range',
      {
        ...initialBuilder(),
        slots: [
          ...initialBuilder().slots.slice(1),
          { classId: 'x', tiers: { strength: 4, dexterity: 0, intelligence: 0, faith: 0 } },
        ],
      },
    ],
    [
      'a missing stat',
      {
        ...initialBuilder(),
        slots: [...initialBuilder().slots.slice(1), { classId: 'x', tiers: { strength: 1 } }],
      },
    ],
  ])('throws away %s', (_name, value) => {
    expect(parseBuilder(value)).toBeNull();
  });

  it('an active slot out of range falls back to the first', () => {
    expect(parseBuilder({ ...initialBuilder(), active: 9 })?.active).toBe(0);
  });
});

describe('builderReducer: gear', () => {
  const kit = {
    armour: 'robe',
    left: 'shield',
    right: 'axe',
    backup: [null, null] as const,
    twoHanded: false,
    upgrades: {},
  };

  const known = new Map(
    ['robe', 'shield', 'axe'].map((id) => [
      id,
      { _id: id, equip: 'hand' as const, hands: 1 as const },
    ]),
  );

  it('fillGear gives slots without gear their class kit and drops unknown saved cards', () => {
    const start = initialBuilder();
    const withSaved = builderReducer(
      {
        ...start,
        slots: start.slots.map((s, i) => (i === 1 ? { ...s, gear: { ...kit, right: 'gone' } } : s)),
      },
      { type: 'fillGear', kits: { warrior: kit }, known: known },
    );
    expect(withSaved.slots[0]?.gear).toEqual(kit); // warrior: its kit
    expect(withSaved.slots[1]?.gear).toMatchObject({ right: null, armour: 'robe' }); // saved, cleaned
    expect(withSaved.slots[2]?.gear).toBeNull(); // cleric: no kit listed yet
    const again = builderReducer(withSaved, {
      type: 'fillGear',
      kits: { warrior: kit },
      known: known,
    });
    expect(again).toBe(withSaved);
  });

  it('a new class brings its kit; equip acts on the active slot only', () => {
    const state = run(
      { type: 'selectSlot', slot: 2 },
      { type: 'setClass', classId: 'herald', kit },
      { type: 'equip', slot: 'right', card: { _id: 'halberd', equip: 'hand', hands: 2 } },
    );
    expect(active(state).gear).toMatchObject({
      twoHanded: true,
      left: null,
      backup: ['shield', null],
    });
    const emptied = builderReducer(state, { type: 'equip', slot: 'armour', card: null });
    expect(active(emptied).gear?.armour).toBeNull();
    expect(emptied.slots[0]?.gear).toBeNull();
  });

  it('attachUpgrade and detachUpgrade act on the active slot’s gear', () => {
    const state = run({ type: 'setClass', classId: 'herald', kit });
    const host = { _id: 'axe', equip: 'hand' as const, upgradeSlots: 1 };
    const shard = { _id: 'shard', equip: 'upgrade' as const, upgradeTarget: 'weapon' as const };
    const on = builderReducer(state, { type: 'attachUpgrade', host, upgrade: shard, costs: {} });
    expect(active(on).gear?.upgrades).toEqual({ axe: ['shard'] });
    const off = builderReducer(on, { type: 'detachUpgrade', hostId: 'axe', upgradeId: 'shard' });
    expect(active(off).gear?.upgrades).toEqual({ axe: [] });
  });

  it('a saved party from before upgrades loads with none', () => {
    const { upgrades: _none, ...old } = kit;
    const saved = {
      ...initialBuilder(),
      slots: initialBuilder().slots.map((s) => ({ ...s, gear: old })),
    };
    expect(parseBuilder(saved)?.slots[0]?.gear?.upgrades).toEqual({});
  });

  it('a saved party keeps its gear; malformed gear comes back as null (kit again)', () => {
    const state = run({ type: 'setClass', classId: 'herald', kit });
    expect(parseBuilder(JSON.parse(JSON.stringify(state)))).toEqual(state);
    const broken = {
      ...state,
      slots: state.slots.map((s) => ({ ...s, gear: { ...kit, backup: ['x'] } })),
    };
    expect(parseBuilder(broken)?.slots.every((s) => s.gear === null)).toBe(true);
  });
});

describe('builderReducer: calculator', () => {
  const kit = {
    armour: 'robe',
    left: 'shield',
    right: 'axe',
    backup: [null, null] as const,
    twoHanded: false,
    upgrades: {},
  };
  const inputs = {
    dice: { black: 2, blue: 0, orange: 0 },
    modifier: 0,
    stamina: 3,
  };
  const edited = run(
    { type: 'setClass', classId: 'herald', kit },
    { type: 'setCalc', calc: { weapon: 'right', option: 1, inputs } },
  );

  it('keeps the settings while the right hand holds the same card', () => {
    const state = builderReducer(edited, { type: 'equip', slot: 'armour', card: null });
    expect(active(state).calc).toEqual({ weapon: 'right', option: 1, inputs });
  });

  it('goes back to the strongest option when the right-hand card changes or leaves', () => {
    const swapped = builderReducer(edited, {
      type: 'equip',
      slot: 'right',
      card: { _id: 'sword', equip: 'hand', hands: 1 },
    });
    expect(active(swapped).calc).toBeNull();
    const moved = builderReducer(edited, {
      type: 'equip',
      slot: 'backup0',
      card: { _id: 'axe', equip: 'hand', hands: 1 },
    });
    expect(active(moved).gear?.right).toBeNull();
    expect(active(moved).calc).toBeNull();
  });

  it('with the left hand chosen, only a left-hand change resets it', () => {
    const left = builderReducer(edited, {
      type: 'setCalc',
      calc: { weapon: 'left', option: 0, inputs },
    });
    const rightSwap = builderReducer(left, {
      type: 'equip',
      slot: 'right',
      card: { _id: 'sword', equip: 'hand', hands: 1 },
    });
    expect(active(rightSwap).calc?.weapon).toBe('left');
    const leftSwap = builderReducer(left, {
      type: 'equip',
      slot: 'left',
      card: { _id: 'flame', equip: 'hand', hands: 1 },
    });
    expect(active(leftSwap).calc).toBeNull();
  });

  it('stores values inside the limits, and survives a reload', () => {
    const state = builderReducer(edited, {
      type: 'setCalc',
      calc: { weapon: 'right', option: null, inputs: { ...inputs, stamina: 14 } },
    });
    expect(active(state).calc?.inputs.stamina).toBe(10);
    expect(parseBuilder(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });
});

describe('builderReducer: enemy health', () => {
  it('is one value for the whole party, kept inside 1–40, and survives a reload', () => {
    const state = run({ type: 'setTargetHealth', health: 55 }, { type: 'selectSlot', slot: 2 });
    expect(state.targetHealth).toBe(40);
    expect(builderReducer(state, { type: 'setTargetHealth', health: 0 }).targetHealth).toBe(1);
    expect(parseBuilder(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });

  it('gives saves from before it the default', () => {
    const { targetHealth: _, ...old } = initialBuilder();
    expect(parseBuilder(old)?.targetHealth).toBe(DEFAULT_HEALTH);
  });
});

describe('builderReducer: upgrade conditions', () => {
  it('"target is a boss" is party-wide; "4+ damage" belongs to the active slot', () => {
    const state = run(
      { type: 'setTargetIsBoss', on: true },
      { type: 'selectSlot', slot: 1 },
      { type: 'setHeavilyDamaged', on: true },
    );
    expect(state.targetIsBoss).toBe(true);
    expect(state.slots.map((slot) => slot.heavilyDamaged)).toEqual([false, true, false, false]);
    expect(parseBuilder(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });
});
