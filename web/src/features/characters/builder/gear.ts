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
  /**
   * Upgrade cards per host card (`_id` → upgrade `_id`s). Upgrades belong to the card, not the
   * slot: they move with it and come off when it leaves the gear.
   */
  upgrades: Readonly<Record<string, readonly string[]>>;
};

export const GEAR_SLOTS = ['armour', 'left', 'right', 'backup0', 'backup1'] as const;
export type GearSlot = (typeof GEAR_SLOTS)[number];

export const EMPTY_GEAR: Gear = {
  armour: null,
  left: null,
  right: null,
  backup: [null, null],
  twoHanded: false,
  upgrades: {},
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

/** Every card in a slot (backups included), each once. */
function cardsInGear(gear: Gear): Set<string> {
  return new Set(GEAR_SLOTS.flatMap((slot) => cardIn(gear, slot) ?? []));
}

/** Upgrades of cards no longer in the gear come off. */
function pruneUpgrades(gear: Gear): Gear {
  const held = cardsInGear(gear);
  const hosts = Object.keys(gear.upgrades);
  if (hosts.every((host) => held.has(host))) return gear;
  return {
    ...gear,
    upgrades: Object.fromEntries(Object.entries(gear.upgrades).filter(([host]) => held.has(host))),
  };
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
  // An empty right hand (its card moved to backup, or the slot was emptied) holds nothing two-handed.
  if (next.right === null) next = { ...next, twoHanded: false };
  return pruneUpgrades(next);
}

/** Going two-handed would drop the left-hand card: there's one, and both backups are full. */
export function leftHandWouldDrop(gear: Gear): boolean {
  return gear.left !== null && gear.backup[0] !== null && gear.backup[1] !== null;
}

/**
 * Cards in `before` that `after` no longer holds, other than `replaced` (the card the player swapped
 * out on purpose). Non-empty only when going two-handed dropped the left-hand card; the page says so.
 */
export function cardsLost(before: Gear, after: Gear, replaced: string | null): string[] {
  const held = cardsInGear(after);
  return [...cardsInGear(before)].filter((id) => id !== replaced && !held.has(id));
}

/** The toggle. Turning it on frees the left hand; the page locks it on for a two-handed card. */
export function setTwoHanded(gear: Gear, on: boolean): Gear {
  return on
    ? pruneUpgrades(freeLeftHand({ ...gear, twoHanded: true }))
    : { ...gear, twoHanded: false };
}

/** Saved ids the catalog no longer has become empty slots, and their upgrades come off. */
export function dropUnknown(gear: Gear, known: ReadonlySet<string>): Gear {
  const keep = (id: string | null) => (id !== null && known.has(id) ? id : null);
  const lostUpgrade = Object.values(gear.upgrades).some((ids) => ids.some((id) => !known.has(id)));
  const next = pruneUpgrades({
    ...gear,
    armour: keep(gear.armour),
    left: keep(gear.left),
    right: keep(gear.right),
    backup: [keep(gear.backup[0]), keep(gear.backup[1])],
    upgrades: lostUpgrade
      ? Object.fromEntries(
          Object.entries(gear.upgrades).map(([host, ids]) => [
            host,
            ids.filter((id) => known.has(id)),
          ]),
        )
      : gear.upgrades,
  });
  const same =
    next.upgrades === gear.upgrades &&
    GEAR_SLOTS.every((slot) => cardIn(next, slot) === cardIn(gear, slot));
  return same ? gear : next;
}

/** A card that can carry upgrades: where it goes and how many slots it prints. */
export type UpgradeHost = Pick<Treasure, '_id' | 'equip' | 'upgradeSlots'>;
/** An upgrade card: what it fits and how many slots it takes. */
export type UpgradeCard = Pick<Treasure, '_id' | 'equip' | 'upgradeTarget' | 'upgradeSlotCost'>;

/** Slots an upgrade takes: 1 unless the card says more (Dragon Scale: 2). */
export function upgradeCost(upgrade: Pick<Treasure, 'upgradeSlotCost'>): number {
  return upgrade.upgradeSlotCost ?? 1;
}

/** Weapon upgrades go on hand cards (shields included), armour upgrades on armour. */
export function fitsHost(
  host: Pick<Treasure, 'equip'>,
  upgrade: Pick<Treasure, 'equip' | 'upgradeTarget'>,
): boolean {
  if (upgrade.equip !== 'upgrade') return false;
  if (upgrade.upgradeTarget === 'weapon') return host.equip === 'hand';
  return upgrade.upgradeTarget === 'armour' && host.equip === 'armour';
}

/** Upgrade slots on `host` not taken; `costOf` gives each attached upgrade's cost. */
export function freeUpgradeSlots(
  gear: Gear,
  host: UpgradeHost,
  costOf: (id: string) => number,
): number {
  const used = (gear.upgrades[host._id] ?? []).reduce((sum, id) => sum + costOf(id), 0);
  return host.upgradeSlots - used;
}

/**
 * Attach an upgrade to a card in the gear, if it fits that card and its free slots. An upgrade
 * already on another card moves (one copy); on this card it stays where it is.
 */
export function attachUpgrade(
  gear: Gear,
  host: UpgradeHost,
  upgrade: UpgradeCard,
  costOf: (id: string) => number,
): Gear {
  if (!cardsInGear(gear).has(host._id) || !fitsHost(host, upgrade)) return gear;
  if (gear.upgrades[host._id]?.includes(upgrade._id)) return gear;
  if (freeUpgradeSlots(gear, host, costOf) < upgradeCost(upgrade)) return gear;
  const upgrades: Record<string, readonly string[]> = Object.fromEntries(
    Object.entries(gear.upgrades).map(([id, ids]) => [id, ids.filter((u) => u !== upgrade._id)]),
  );
  upgrades[host._id] = [...(upgrades[host._id] ?? []), upgrade._id];
  return { ...gear, upgrades };
}

export function detachUpgrade(gear: Gear, hostId: string, upgradeId: string): Gear {
  const ids = gear.upgrades[hostId];
  if (!ids?.includes(upgradeId)) return gear;
  return {
    ...gear,
    upgrades: { ...gear.upgrades, [hostId]: ids.filter((id) => id !== upgradeId) },
  };
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
    upgrades: {},
  };
}
