import { describe, expect, it } from 'vitest';
import type { Treasure } from '@/shared/api/types';
import {
  dropUnknown,
  EMPTY_GEAR,
  equip,
  equippedIds,
  setTwoHanded,
  slotAccepts,
  starterKit,
  type Gear,
} from './gear';

type Kind = 'armour' | 'shield' | 'physical' | 'magical' | 'upgrade';

/** A treasure card with just what placement reads. */
function card(id: string, kind: Kind, hands?: 1 | 2, extra: Partial<Treasure> = {}): Treasure {
  const attack = (damageType: 'physical' | 'magical') => ({ damageType, staminaCost: 0, dice: {} });
  return {
    _id: id,
    deck: 'starter',
    class: 'x',
    equip: kind === 'armour' ? 'armour' : kind === 'upgrade' ? 'upgrade' : 'hand',
    ...(hands ? { hands } : {}),
    attacks: kind === 'physical' || kind === 'magical' ? [attack(kind)] : [],
    ...extra,
  } as unknown as Treasure;
}

describe('starterKit', () => {
  it('armour; a one-handed physical weapon right; a shield left; the rest to backup', () => {
    // Pyromancer-like: the flame (magical) is a weapon too, but the axe goes in the hand.
    const kit = starterKit('x', [
      card('a-flame', 'magical', 1),
      card('b-shield', 'shield', 1),
      card('c-garb', 'armour'),
      card('d-axe', 'physical', 1),
    ]);
    expect(kit).toEqual({
      armour: 'c-garb',
      right: 'd-axe',
      left: 'b-shield',
      backup: ['a-flame', null],
      twoHanded: false,
    });
  });

  it('a one-handed weapon beats a two-handed one; the two-handed goes to backup', () => {
    // Thief: knife in hand, shortbow carried.
    const kit = starterKit('x', [card('a-bow', 'physical', 2), card('b-knife', 'physical', 1)]);
    expect(kit.right).toBe('b-knife');
    expect(kit.backup).toEqual(['a-bow', null]);
    expect(kit.twoHanded).toBe(false);
  });

  it('only a two-handed weapon: it goes right, two-handed on, the shield to backup', () => {
    // Mercenary: Sellsword Twinblade.
    const kit = starterKit('x', [
      card('a-shield', 'shield', 1),
      card('b-twinblade', 'physical', 2),
    ]);
    expect(kit).toMatchObject({ right: 'b-twinblade', left: null, twoHanded: true });
    expect(kit.backup).toEqual(['a-shield', null]);
  });

  it('only magical weapons: the first one-handed one goes right', () => {
    const kit = starterKit('x', [card('a-staff', 'magical', 2), card('b-catalyst', 'magical', 1)]);
    expect(kit.right).toBe('b-catalyst');
  });

  it('takes only that class’s starter cards', () => {
    const kit = starterKit('x', [
      card('a-other', 'armour', undefined, { class: 'y' }),
      card('b-deck', 'armour', undefined, { deck: 'treasure' }),
      card('c-mine', 'armour'),
    ]);
    expect(kit.armour).toBe('c-mine');
    expect(starterKit('nobody', [card('a', 'armour')])).toEqual(EMPTY_GEAR);
  });
});

describe('slotAccepts', () => {
  it.each([
    ['armour', 'armour', undefined, true],
    ['armour', 'physical', 1, false],
    ['left', 'shield', 1, true],
    ['left', 'physical', 2, false],
    ['right', 'physical', 2, true],
    ['right', 'armour', undefined, false],
    ['backup0', 'armour', undefined, true],
    ['backup1', 'physical', 2, true],
    ['backup0', 'upgrade', undefined, false],
    ['right', 'upgrade', undefined, false],
  ] as const)('%s takes %s (%s hands): %s', (slot, kind, hands, ok) => {
    expect(slotAccepts(slot, card('c', kind, hands))).toBe(ok);
  });
});

describe('equip', () => {
  const gear: Gear = {
    armour: 'robe',
    left: 'shield',
    right: 'axe',
    backup: [null, null],
    twoHanded: false,
  };

  it('a two-handed weapon in the right hand empties the left hand into backup', () => {
    const next = equip(gear, 'right', card('greatsword', 'physical', 2));
    expect(next).toMatchObject({ right: 'greatsword', left: null, twoHanded: true });
    expect(next.backup).toEqual(['shield', null]);
  });

  it('with both backups full, the left-hand card is dropped', () => {
    const full = { ...gear, backup: ['bow', 'flame'] as const };
    expect(equip(full, 'right', card('greatsword', 'physical', 2)).backup).toEqual([
      'bow',
      'flame',
    ]);
  });

  it('a one-handed weapon turns two-handed off; the left hand stays free until filled', () => {
    const two = equip(gear, 'right', card('greatsword', 'physical', 2));
    const one = equip(two, 'right', card('dagger', 'physical', 1));
    expect(one).toMatchObject({ twoHanded: false, left: null });
    expect(equip(one, 'left', card('buckler', 'shield', 1)).left).toBe('buckler');
  });

  it('nothing goes in the left hand while two-handed, nor in a slot that doesn’t take it', () => {
    const two = setTwoHanded(gear, true);
    expect(equip(two, 'left', card('buckler', 'shield', 1))).toBe(two);
    expect(equip(gear, 'left', card('greatsword', 'physical', 2))).toBe(gear);
    expect(equip(gear, 'armour', card('dagger', 'physical', 1))).toBe(gear);
  });

  it('a card moves rather than sitting in two slots; null empties a slot', () => {
    const moved = equip(
      { ...gear, backup: ['dagger', null] },
      'right',
      card('dagger', 'physical', 1),
    );
    expect(moved).toMatchObject({ right: 'dagger', backup: [null, null] });
    expect(equip(gear, 'armour', null).armour).toBeNull();
  });

  it('backup cards never count as equipped', () => {
    expect(equippedIds({ ...gear, backup: ['bow', 'flame'] })).toEqual(['robe', 'shield', 'axe']);
    expect(equippedIds(setTwoHanded(gear, true))).toEqual(['robe', 'axe']);
  });

  it('the two-handed toggle frees the left hand on, and leaves it empty off', () => {
    const on = setTwoHanded(gear, true);
    expect(on).toMatchObject({ twoHanded: true, left: null, backup: ['shield', null] });
    expect(setTwoHanded(on, false)).toMatchObject({ twoHanded: false, left: null });
  });
});

describe('dropUnknown', () => {
  it('empties slots whose card the catalog doesn’t have, and keeps the same object otherwise', () => {
    const gear: Gear = { ...EMPTY_GEAR, armour: 'robe', right: 'gone', backup: ['bow', 'gone2'] };
    expect(dropUnknown(gear, new Set(['robe', 'bow']))).toEqual({
      ...gear,
      right: null,
      backup: ['bow', null],
    });
    expect(dropUnknown(gear, new Set(['robe', 'bow', 'gone', 'gone2']))).toBe(gear);
  });
});
