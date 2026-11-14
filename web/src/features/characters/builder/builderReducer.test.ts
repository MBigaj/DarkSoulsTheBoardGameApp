import { describe, expect, it } from 'vitest';
import {
  builderReducer,
  initialBuilder,
  parseBuilder,
  soulsSpent,
  type BuilderAction,
  type BuilderState,
} from './builderReducer';

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
      { type: 'setClass', classId: 'herald' },
    );
    expect(state.slots.map((s) => s.classId)).toEqual(['warrior', 'herald', 'cleric', 'thief']);
    expect(soulsSpent(active(state).tiers)).toBe(0);
  });

  it('picking the class it already has keeps the tiers', () => {
    const state = run(
      { type: 'setTier', stat: 'strength', tier: 1 },
      { type: 'setClass', classId: 'warrior' },
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
        { classId: 'gone', tiers: { strength: 2, dexterity: 0, intelligence: 0, faith: 0 } },
        ...initialBuilder().slots.slice(1),
      ],
    };
    const state = builderReducer(saved, { type: 'syncClasses', ids });
    expect(state.slots[0]).toEqual({ classId: 'warrior', tiers: initialBuilder().slots[0]?.tiers });
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
