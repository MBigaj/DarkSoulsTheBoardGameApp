/** Character Builder state: four party slots, each a class, its bought stat tiers and its gear. Pure. */

import {
  attachUpgrade,
  detachUpgrade,
  dropUnknown,
  equip,
  type Gear,
  type GearCard,
  type GearSlot,
  type UpgradeCard,
  type UpgradeHost,
} from './gear';
import { clampHealth, clampInputs, DEFAULT_HEALTH, parseCalc, type Calc } from './calculator';

export const STATS = ['strength', 'dexterity', 'intelligence', 'faith'] as const;
export type Stat = (typeof STATS)[number];

/** 0 = base, 1–3 = tiers bought at the bonfire. */
export type Tier = 0 | 1 | 2 | 3;
export type Tiers = Record<Stat, Tier>;

/** Souls each tier costs (rulebook): tier 1 = 2, tier 2 = 4, tier 3 = 8. */
export const TIER_COST: readonly number[] = [0, 2, 4, 8];

export const SLOT_COUNT = 4;

/**
 * `gear: null` = not set up yet: the class's starter kit goes in once the catalog is loaded.
 * `calc: null` = the calculator shows the right-hand card's strongest attack option.
 */
export type PartySlot = {
  classId: string;
  tiers: Tiers;
  gear: Gear | null;
  calc: Calc | null;
  /** Four or more damage cubes on the endurance bar, for upgrades like Red Tearstone Ring. */
  heavilyDamaged: boolean;
};
/**
 * The enemy the calculator works against, shared by the party: `targetHealth` for the chance to kill,
 * `targetIsBoss` for "against bosses" upgrades (Dragon Scale).
 */
export type BuilderState = {
  active: number;
  slots: readonly PartySlot[];
  targetHealth: number;
  targetIsBoss: boolean;
};

export type BuilderAction =
  | { type: 'selectSlot'; slot: number }
  /** The active slot's class. A new class starts from its base stats and `kit` (null until the catalog loads). */
  | { type: 'setClass'; classId: string; kit: Gear | null }
  /** A card into one of the active slot's gear slots (null empties it); see `equip` in gear.ts. */
  | { type: 'equip'; slot: GearSlot; card: GearCard | null }
  /** The active slot's calculator: an attack option loaded, or edited values (`option: null`). */
  | { type: 'setCalc'; calc: Calc }
  | { type: 'setTargetHealth'; health: number }
  | { type: 'setTargetIsBoss'; on: boolean }
  | { type: 'setHeavilyDamaged'; on: boolean }
  /** An upgrade onto a card of the active slot's gear; `costs` = slots each upgrade card takes. */
  | {
      type: 'attachUpgrade';
      host: UpgradeHost;
      upgrade: UpgradeCard;
      costs: Readonly<Record<string, number>>;
    }
  | { type: 'detachUpgrade'; hostId: string; upgradeId: string }
  /**
   * The catalog is loaded: slots without gear get their class's starter kit, and saved card ids the
   * catalog doesn't have are dropped.
   */
  | { type: 'fillGear'; kits: Readonly<Record<string, Gear>>; known: ReadonlyMap<string, GearCard> }
  /** Buy up to `tier` (every lower tier comes with it); a lower tier than owned sells back down. */
  | { type: 'setTier'; stat: Stat; tier: Tier }
  /** The active slot back to base stats. */
  | { type: 'reset' }
  /**
   * The classes the store has. A slot whose class isn't among them (a saved party from an older
   * store) gets a known class and base stats, so the state never holds an id nothing can show.
   */
  | { type: 'syncClasses'; ids: readonly string[] };

/** The canvas party. */
export const DEFAULT_PARTY = ['warrior', 'sorcerer', 'cleric', 'thief'] as const;

const BASE: Tiers = { strength: 0, dexterity: 0, intelligence: 0, faith: 0 };

export function initialBuilder(): BuilderState {
  return {
    active: 0,
    slots: DEFAULT_PARTY.map((classId) => ({
      classId,
      tiers: BASE,
      gear: null,
      calc: null,
      heavilyDamaged: false,
    })),
    targetHealth: DEFAULT_HEALTH,
    targetIsBoss: false,
  };
}

/** Souls spent on one stat at `tier`: tiers are bought in order, so all the ones below count. */
export function tierSouls(tier: Tier): number {
  return TIER_COST.slice(1, tier + 1).reduce((sum, cost) => sum + cost, 0);
}

export function soulsSpent(tiers: Tiers): number {
  return STATS.reduce((sum, stat) => sum + tierSouls(tiers[stat]), 0);
}

/**
 * New gear for a slot. A different card (or none) in the calculator's hand has other attack
 * options, so the calculator goes back to its default weapon and strongest option.
 */
function withGear(slot: PartySlot, gear: Gear | null): PartySlot {
  if (gear === slot.gear) return slot;
  const hand = slot.calc?.weapon ?? 'right';
  const calc = gear?.[hand] === slot.gear?.[hand] ? slot.calc : null;
  return { ...slot, gear, calc };
}

function updateActive(state: BuilderState, update: (slot: PartySlot) => PartySlot): BuilderState {
  return {
    ...state,
    slots: state.slots.map((slot, i) => (i === state.active ? update(slot) : slot)),
  };
}

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'selectSlot':
      return action.slot >= 0 && action.slot < state.slots.length
        ? { ...state, active: action.slot }
        : state;
    case 'setClass':
      return updateActive(state, (slot) =>
        slot.classId === action.classId
          ? slot
          : {
              classId: action.classId,
              tiers: BASE,
              gear: action.kit,
              calc: null,
              heavilyDamaged: false,
            },
      );
    case 'equip':
      return updateActive(state, (slot) =>
        slot.gear ? withGear(slot, equip(slot.gear, action.slot, action.card)) : slot,
      );
    case 'setCalc':
      return updateActive(state, (slot) => ({
        ...slot,
        calc: { ...action.calc, inputs: clampInputs(action.calc.inputs) },
      }));
    case 'attachUpgrade':
      return updateActive(state, (slot) =>
        slot.gear
          ? {
              ...slot,
              gear: attachUpgrade(
                slot.gear,
                action.host,
                action.upgrade,
                (id) => action.costs[id] ?? 1,
              ),
            }
          : slot,
      );
    case 'detachUpgrade':
      return updateActive(state, (slot) =>
        slot.gear
          ? { ...slot, gear: detachUpgrade(slot.gear, action.hostId, action.upgradeId) }
          : slot,
      );
    case 'fillGear':
      return fillGear(state, action.kits, action.known);
    case 'setTier':
      return updateActive(state, (slot) => ({
        ...slot,
        tiers: { ...slot.tiers, [action.stat]: action.tier },
      }));
    case 'setTargetHealth':
      return { ...state, targetHealth: clampHealth(action.health) };
    case 'setTargetIsBoss':
      return { ...state, targetIsBoss: action.on };
    case 'setHeavilyDamaged':
      return updateActive(state, (slot) => ({ ...slot, heavilyDamaged: action.on }));
    case 'reset':
      return updateActive(state, (slot) => ({ ...slot, tiers: BASE }));
    case 'syncClasses':
      return syncClasses(state, action.ids);
  }
}

function syncClasses(state: BuilderState, ids: readonly string[]): BuilderState {
  const known = new Set(ids);
  const [first] = ids;
  if (first === undefined || state.slots.every((slot) => known.has(slot.classId))) return state;
  return {
    ...state,
    slots: state.slots.map((slot, i) => {
      if (known.has(slot.classId)) return slot;
      // The canvas class for this slot if the store has it, else the first one.
      const preferred = DEFAULT_PARTY[i];
      return {
        classId: preferred && known.has(preferred) ? preferred : first,
        tiers: BASE,
        gear: null,
        calc: null,
        heavilyDamaged: false,
      };
    }),
  };
}

function fillGear(
  state: BuilderState,
  kits: Readonly<Record<string, Gear>>,
  known: ReadonlyMap<string, GearCard>,
): BuilderState {
  const slots = state.slots.map((slot) => {
    const gear = slot.gear ? dropUnknown(slot.gear, known) : (kits[slot.classId] ?? null);
    return withGear(slot, gear);
  });
  return slots.every((slot, i) => slot === state.slots[i]) ? state : { ...state, slots };
}

const isTier = (value: unknown): value is Tier =>
  value === 0 || value === 1 || value === 2 || value === 3;

function parseSlot(value: unknown): PartySlot | null {
  if (typeof value !== 'object' || value === null) return null;
  const { classId, tiers } = value as Partial<Record<string, unknown>>;
  if (typeof classId !== 'string' || typeof tiers !== 'object' || tiers === null) return null;
  const parsed = { ...BASE };
  for (const stat of STATS) {
    const tier = (tiers as Partial<Record<string, unknown>>)[stat];
    if (!isTier(tier)) return null;
    parsed[stat] = tier;
  }
  const { gear, calc, heavilyDamaged } = value as Record<string, unknown>;
  return {
    classId,
    tiers: parsed,
    gear: parseGear(gear),
    calc: parseCalc(calc),
    heavilyDamaged: heavilyDamaged === true,
  };
}

const isId = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

/** Saved gear, or null (the starter kit goes back in) if it's missing or malformed. */
function parseGear(value: unknown): Gear | null {
  if (typeof value !== 'object' || value === null) return null;
  const { armour, left, right, backup, twoHanded } = value as Partial<Record<string, unknown>>;
  if (!isId(armour) || !isId(left) || !isId(right) || typeof twoHanded !== 'boolean') return null;
  if (!Array.isArray(backup) || backup.length !== 2 || !backup.every(isId)) return null;
  const [b0, b1] = backup;
  return {
    armour,
    left,
    right,
    backup: [b0 ?? null, b1 ?? null],
    twoHanded,
    upgrades: parseUpgrades((value as { upgrades?: unknown }).upgrades),
  };
}

/** Saved upgrades; missing (a save from before upgrades) or malformed → none. */
function parseUpgrades(value: unknown): Gear['upgrades'] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  const valid = Object.values(value).every(
    (ids) => Array.isArray(ids) && ids.every((id) => typeof id === 'string'),
  );
  return valid ? (value as Gear['upgrades']) : {};
}

/**
 * A saved party (localStorage), or null if it isn't one: anything else is thrown away rather than
 * half-loaded. Class ids aren't checked here; the page falls back for one it doesn't know.
 */
export function parseBuilder(value: unknown): BuilderState | null {
  if (typeof value !== 'object' || value === null) return null;
  const { active, slots, targetHealth, targetIsBoss } = value as Partial<Record<string, unknown>>;
  if (!Array.isArray(slots) || slots.length !== SLOT_COUNT) return null;
  const parsed = slots.map(parseSlot);
  if (parsed.some((slot) => slot === null)) return null;
  const slot = typeof active === 'number' && Number.isInteger(active) ? active : 0;
  return {
    active: slot >= 0 && slot < SLOT_COUNT ? slot : 0,
    slots: parsed as PartySlot[],
    // Saves from before the health setting get the default.
    targetHealth:
      typeof targetHealth === 'number' && Number.isFinite(targetHealth)
        ? clampHealth(targetHealth)
        : DEFAULT_HEALTH,
    targetIsBoss: targetIsBoss === true,
  };
}
