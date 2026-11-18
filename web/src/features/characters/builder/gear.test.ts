import { describe, expect, it } from 'vitest';
import type { Treasure } from '@/shared/api/types';
import {
  attachUpgrade,
  cardsLost,
  detachUpgrade,
  dropUnknown,
  EMPTY_GEAR,
  equip,
  equippedIds,
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
      upgrades: {},
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

/** A catalog for `dropUnknown`: id → card (only `hands` matters). */
const catalog = (ids: string[], twoHanded: string[] = []) =>
  new Map(ids.map((id) => [id, card(id, 'physical', twoHanded.includes(id) ? 2 : 1)]));

describe('equip', () => {
  const gear: Gear = {
    armour: 'robe',
    left: 'shield',
    right: 'axe',
    backup: [null, null],
    twoHanded: false,
    upgrades: {},
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
    const two = equip(gear, 'right', card('greatsword', 'physical', 2));
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

  it('the two-handed card leaving the right hand turns two-handed off', () => {
    const two = equip(gear, 'right', card('halberd', 'physical', 2));
    const moved = equip(two, 'backup1', card('halberd', 'physical', 2));
    expect(moved).toMatchObject({ right: null, twoHanded: false });
    expect(equip(two, 'right', null)).toMatchObject({ right: null, twoHanded: false });
    // The left hand takes a card again.
    expect(equip(moved, 'left', card('buckler', 'shield', 1)).left).toBe('buckler');
  });

  it('says which card a two-handed pick dropped, and only that one', () => {
    const full: Gear = { ...gear, backup: ['bow', 'flame'] };
    const after = equip(full, 'right', card('greatsword', 'physical', 2));
    expect(cardsLost(full, after, 'axe')).toEqual(['shield']);
    // A swap that drops nothing else: only the replaced card leaves, and that's on purpose.
    expect(cardsLost(gear, equip(gear, 'right', card('dagger', 'physical', 1)), 'axe')).toEqual([]);
    // The two-handed card came from a backup, freeing a slot: nothing lost.
    const fromBackup = { ...full, backup: ['greatsword', 'flame'] as const };
    expect(
      cardsLost(fromBackup, equip(fromBackup, 'right', card('greatsword', 'physical', 2)), 'axe'),
    ).toEqual([]);
  });

  it('backup cards never count as equipped', () => {
    expect(equippedIds({ ...gear, backup: ['bow', 'flame'] })).toEqual(['robe', 'shield', 'axe']);
    expect(equippedIds(equip(gear, 'right', card('greatsword', 'physical', 2)))).toEqual([
      'robe',
      'greatsword',
    ]);
  });
});

describe('dropUnknown', () => {
  it('empties slots whose card the catalog doesn’t have, and keeps the same object otherwise', () => {
    const gear: Gear = { ...EMPTY_GEAR, armour: 'robe', right: 'gone', backup: ['bow', 'gone2'] };
    expect(dropUnknown(gear, catalog(['robe', 'bow']))).toEqual({
      ...gear,
      right: null,
      backup: ['bow', null],
    });
    expect(dropUnknown(gear, catalog(['robe', 'bow', 'gone', 'gone2']))).toBe(gear);
  });

  it('makes two-handed follow the right-hand card, not an old toggle', () => {
    const gear: Gear = { ...EMPTY_GEAR, left: 'shield', right: 'axe', twoHanded: true };
    // A one-handed axe saved with the old toggle on: off again.
    expect(dropUnknown(gear, catalog(['shield', 'axe'])).twoHanded).toBe(false);
    // A two-handed card saved with a left-hand card: the left one goes to backup.
    const saved: Gear = { ...EMPTY_GEAR, left: 'shield', right: 'halberd', twoHanded: false };
    expect(dropUnknown(saved, catalog(['shield', 'halberd'], ['halberd']))).toMatchObject({
      twoHanded: true,
      left: null,
      backup: ['shield', null],
    });
  });
});

describe('upgrades', () => {
  const host = (id: string, equip: 'hand' | 'armour', upgradeSlots: number) => ({
    _id: id,
    equip,
    upgradeSlots,
  });
  const upgrade = (id: string, target: 'weapon' | 'armour', cost?: number) => ({
    _id: id,
    equip: 'upgrade' as const,
    upgradeTarget: target,
    ...(cost ? { upgradeSlotCost: cost } : {}),
  });
  const axe = host('axe', 'hand', 2);
  const robe = host('robe', 'armour', 1);
  const shield = host('shield', 'hand', 1);
  const costs: Record<string, number> = { scale: 2 };
  const costOf = (id: string) => costs[id] ?? 1;
  const gear: Gear = {
    armour: 'robe',
    left: 'shield',
    right: 'axe',
    backup: [null, null],
    twoHanded: false,
    upgrades: {},
  };

  it('weapon upgrades go on hand cards (shields too), armour upgrades on armour', () => {
    expect(attachUpgrade(gear, axe, upgrade('shard', 'weapon'), costOf).upgrades).toEqual({
      axe: ['shard'],
    });
    expect(attachUpgrade(gear, shield, upgrade('shard', 'weapon'), costOf).upgrades).toEqual({
      shield: ['shard'],
    });
    expect(attachUpgrade(gear, robe, upgrade('ring', 'armour'), costOf).upgrades).toEqual({
      robe: ['ring'],
    });
    expect(attachUpgrade(gear, robe, upgrade('shard', 'weapon'), costOf)).toBe(gear);
    expect(attachUpgrade(gear, axe, upgrade('ring', 'armour'), costOf)).toBe(gear);
  });

  it('only into free slots: a 2-slot upgrade needs both', () => {
    const one = attachUpgrade(gear, axe, upgrade('shard', 'weapon'), costOf);
    expect(attachUpgrade(one, axe, upgrade('scale', 'weapon', 2), costOf)).toBe(one);
    expect(attachUpgrade(gear, axe, upgrade('scale', 'weapon', 2), costOf).upgrades).toEqual({
      axe: ['scale'],
    });
    const full = attachUpgrade(one, axe, upgrade('gem', 'weapon'), costOf);
    expect(attachUpgrade(full, axe, upgrade('ember', 'weapon'), costOf)).toBe(full);
    expect(attachUpgrade(gear, host('club', 'hand', 0), upgrade('shard', 'weapon'), costOf)).toBe(
      gear,
    );
  });

  it('a card not in the gear takes none', () => {
    expect(attachUpgrade(gear, host('other', 'hand', 2), upgrade('shard', 'weapon'), costOf)).toBe(
      gear,
    );
  });

  it('one copy: an upgrade on another card moves', () => {
    const onAxe = attachUpgrade(gear, axe, upgrade('shard', 'weapon'), costOf);
    const moved = attachUpgrade(onAxe, shield, upgrade('shard', 'weapon'), costOf);
    expect(moved.upgrades).toEqual({ axe: [], shield: ['shard'] });
  });

  it('upgrades move with their card, and come off when it leaves the gear', () => {
    const onShield = attachUpgrade(gear, shield, upgrade('shard', 'weapon'), costOf);
    // Two-handed: the shield goes to backup, its upgrade with it.
    const two = equip(onShield, 'right', card('greatsword', 'physical', 2));
    expect(two.backup[0]).toBe('shield');
    expect(two.upgrades).toEqual({ shield: ['shard'] });
    // Swapped out: gone.
    expect(equip(onShield, 'left', card('buckler', 'shield', 1)).upgrades).toEqual({});
    expect(equip(onShield, 'left', null).upgrades).toEqual({});
  });

  it('detach removes one upgrade', () => {
    const two = attachUpgrade(
      attachUpgrade(gear, axe, upgrade('shard', 'weapon'), costOf),
      axe,
      upgrade('gem', 'weapon'),
      costOf,
    );
    expect(detachUpgrade(two, 'axe', 'shard').upgrades).toEqual({ axe: ['gem'] });
    expect(detachUpgrade(two, 'axe', 'nope')).toBe(two);
  });

  it('dropUnknown also drops upgrades the catalog lost', () => {
    const withUps: Gear = { ...gear, upgrades: { axe: ['shard', 'gone'] } };
    expect(dropUnknown(withUps, catalog(['robe', 'shield', 'axe', 'shard'])).upgrades).toEqual({
      axe: ['shard'],
    });
    const lostHost: Gear = { ...gear, right: 'gone-axe', upgrades: { 'gone-axe': ['shard'] } };
    expect(dropUnknown(lostHost, catalog(['robe', 'shield', 'shard'])).upgrades).toEqual({});
  });
});
