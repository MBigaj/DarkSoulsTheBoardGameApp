import type { Treasure } from '@/shared/api/types';

/** A character's equipment: treasure `_id`s, or null for an empty slot. */
export type Gear = {
  armour: string | null;
  left: string | null;
  right: string | null;
  /** Carried, never equipped. */
  backup: readonly [string | null, string | null];
  /** The right hand uses both hands; the left hand is empty. */
  twoHanded: boolean;
};

export const GEAR_SLOTS = ['armour', 'left', 'right', 'backup0', 'backup1'] as const;
export type GearSlot = (typeof GEAR_SLOTS)[number];

export const EMPTY_GEAR: Gear = {
  armour: null,
  left: null,
  right: null,
  backup: [null, null],
  twoHanded: false,
};

/** What a card needs to know to be placed: its id, where it goes and how many hands. */
export type GearCard = Pick<Treasure, '_id' | 'equip' | 'hands'>;

/** Which cards a slot takes: armour by `equip`, hands by `equip` and `hands`. Upgrades and consumables go nowhere. */
export function slotAccepts(slot: GearSlot, card: Pick<Treasure, 'equip' | 'hands'>): boolean {
  switch (slot) {
    case 'armour':
      return card.equip === 'armour';
    case 'left':
      return card.equip === 'hand' && card.hands === 1;
    case 'right':
      return card.equip === 'hand';
    case 'backup0':
    case 'backup1':
      return card.equip === 'hand' || card.equip === 'armour';
  }
}

export function cardIn(gear: Gear, slot: GearSlot): string | null {
  if (slot === 'backup0') return gear.backup[0];
  if (slot === 'backup1') return gear.backup[1];
  return gear[slot];
}

function withCard(gear: Gear, slot: GearSlot, id: string | null): Gear {
  if (slot === 'backup0') return { ...gear, backup: [id, gear.backup[1]] };
  if (slot === 'backup1') return { ...gear, backup: [gear.backup[0], id] };
  return { ...gear, [slot]: id };
}

/** Equipped = armour and hands; backup cards never count (rulebook: swap them in during upkeep). */
export function equippedIds(gear: Gear): string[] {
  return [gear.armour, gear.left, gear.right].filter((id): id is string => id !== null);
}

/** The left-hand card goes to the first free backup slot (dropped if both are full); the left hand empties. */
function freeLeftHand(gear: Gear): Gear {
  if (gear.left === null) return gear;
  const [b0, b1] = gear.backup;
  const backup: Gear['backup'] =
    b0 === null ? [gear.left, b1] : b1 === null ? [b0, gear.left] : gear.backup;
  return { ...gear, left: null, backup };
}

/**
 * Put a card in a slot (null empties it). The card leaves any other slot it was in, so one copy is
 * never in two places. A two-handed card in the right hand turns two-handed on (left hand → backup);
 * a one-handed one turns it off. Nothing goes in the left hand while two-handed.
 */
export function equip(gear: Gear, slot: GearSlot, card: GearCard | null): Gear {
  if (card && !slotAccepts(slot, card)) return gear;
  if (slot === 'left' && gear.twoHanded && card) return gear;
  let next = gear;
  if (card) {
    for (const other of GEAR_SLOTS) {
      if (other !== slot && cardIn(next, other) === card._id) next = withCard(next, other, null);
    }
  }
  next = withCard(next, slot, card?._id ?? null);
  if (slot === 'right' && card) {
    next =
      card.hands === 2 ? freeLeftHand({ ...next, twoHanded: true }) : { ...next, twoHanded: false };
  }
  return next;
}

/** The toggle. Turning it on frees the left hand; the page locks it on for a two-handed card. */
export function setTwoHanded(gear: Gear, on: boolean): Gear {
  return on ? freeLeftHand({ ...gear, twoHanded: true }) : { ...gear, twoHanded: false };
}

/** Saved ids the catalog no longer has become empty slots. */
export function dropUnknown(gear: Gear, known: ReadonlySet<string>): Gear {
  const keep = (id: string | null) => (id !== null && known.has(id) ? id : null);
  const next: Gear = {
    ...gear,
    armour: keep(gear.armour),
    left: keep(gear.left),
    right: keep(gear.right),
    backup: [keep(gear.backup[0]), keep(gear.backup[1])],
  };
  return GEAR_SLOTS.every((slot) => cardIn(next, slot) === cardIn(gear, slot)) ? gear : next;
}

type KitCard = Pick<Treasure, '_id' | 'deck' | 'class' | 'equip' | 'hands' | 'attacks'>;

const hasAttack = (card: KitCard) => card.attacks.length > 0;
const hasPhysical = (card: KitCard) => card.attacks.some((a) => a.damageType === 'physical');

/**
 * A class's starting equipment (handoff): its armour; right hand = first one-handed weapon with a
 * physical attack (then any attack; a two-handed one if that's all there is, which turns two-handed
 * on); left hand = a shield (one hand, no attacks); the other hand cards go to backup.
 */
export function starterKit(classId: string, treasure: readonly KitCard[]): Gear {
  const kit = treasure
    .filter((card) => card.deck === 'starter' && card.class === classId)
    .toSorted((a, b) => (a._id < b._id ? -1 : 1));
  const hand = kit.filter((card) => card.equip === 'hand');
  const right =
    hand.find((c) => c.hands === 1 && hasPhysical(c)) ??
    hand.find((c) => c.hands === 1 && hasAttack(c)) ??
    hand.find(hasAttack) ??
    null;
  const twoHanded = right?.hands === 2;
  const left = twoHanded
    ? null
    : (hand.find((c) => c !== right && c.hands === 1 && !hasAttack(c)) ?? null);
  const rest = hand.filter((c) => c !== right && c !== left);
  return {
    armour: kit.find((card) => card.equip === 'armour')?._id ?? null,
    left: left?._id ?? null,
    right: right?._id ?? null,
    backup: [rest[0]?._id ?? null, rest[1]?._id ?? null],
    twoHanded,
  };
}
