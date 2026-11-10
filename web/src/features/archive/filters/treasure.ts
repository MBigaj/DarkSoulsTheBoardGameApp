/** Treasure filters (handoff filter table, Treasure rows). */
import type { Attack, Condition, Treasure } from '@/shared/api/types';
import { DICE, type Die } from '@/shared/lib/card-types';
import {
  atLeast as minSlider,
  atMost as maxSlider,
  list,
  tags,
  type Values,
} from '@/shared/lib/url-state';
import { anyOf, anyOfMany, atLeast, atMost, every } from './match';

const FEATURES = ['nodeAttack', 'push', 'shaft', 'repeat', 'move'] as const;
export type AttackFeature = (typeof FEATURES)[number];

export const treasureFields = {
  deck: list('deck', every<Treasure['deck']>()(['starter', 'treasure', 'boss'])),
  rarity: list('rarity', every<NonNullable<Treasure['rarity']>>()(['common', 'rare', 'legendary'])),
  /** Class slugs, as in `classes/*.json`; the rail lists the classes from the data. */
  class: tags('class'),
  equip: list('slot', every<Treasure['equip']>()(['hand', 'armour', 'upgrade', 'consumable'])),
  hands: list('hands', every<NonNullable<Treasure['hands']>>()([1, 2])),
  strength: maxSlider('str', 0, 40),
  dexterity: maxSlider('dex', 0, 40),
  intelligence: maxSlider('int', 0, 40),
  faith: maxSlider('fai', 0, 40),
  dice: list('dice', DICE),
  damageType: list('damage', every<NonNullable<Attack['damageType']>>()(['physical', 'magical'])),
  conditions: list('status', every<Condition>()(['bleed', 'poison', 'frostbite', 'stagger'])),
  features: list('features', FEATURES),
  range: minSlider('range', 0, 3),
  defence: list('defence', ['block', 'resist'] as const),
  dodge: minSlider('dodge', 0, 2),
  upgradeSlots: minSlider('slots', 0, 2),
};

export type TreasureFilters = Values<typeof treasureFields>;

const RANGE_MAX = treasureFields.range.max;

function hasFeature(attack: Attack, feature: AttackFeature): boolean {
  switch (feature) {
    case 'nodeAttack':
    case 'shaft':
      return attack[feature];
    case 'push':
    case 'repeat':
      return attack[feature] !== undefined;
    case 'move': // the shift symbol before or after the dice
      return attack.move !== undefined || attack.moveAfter !== undefined;
  }
}

/** Dice the card rolls on any attack. */
function diceUsed(card: Treasure): Set<Die> {
  const used = new Set<Die>();
  for (const attack of card.attacks) {
    for (const die of DICE) if (attack.dice[die] !== undefined) used.add(die);
  }
  return used;
}

/** Attack filters: a card without attacks has none of these, so it fails while one is active. */
function matchesAttacks(card: Treasure, f: TreasureFilters): boolean {
  const { attacks } = card;
  if (f.dice.length > 0) {
    if (attacks.length === 0) return false;
    const used = diceUsed(card);
    if (!f.dice.every((die) => used.has(die))) return false; // uses all ticked dice
  }
  if (
    !anyOfMany(
      f.damageType,
      attacks.map((a) => a.damageType),
    )
  )
    return false;
  if (
    !anyOfMany(
      f.conditions,
      attacks.flatMap((a) => a.conditions),
    )
  )
    return false;
  if (
    !anyOfMany(
      f.features,
      FEATURES.filter((x) => attacks.some((a) => hasFeature(a, x))),
    )
  ) {
    return false;
  }
  return true;
}

/** `null` block or resist dice (unknown) keep the card visible. */
function matchesDefence(card: Treasure, f: TreasureFilters): boolean {
  if (f.defence.length === 0) return true;
  const { block, resist } = card.defence;
  const has = (dice: typeof block) => (dice === null ? null : Object.keys(dice).length > 0);
  return f.defence.some((kind) => has(kind === 'block' ? block : resist) !== false);
}

export function matchesTreasure(card: Treasure, f: TreasureFilters): boolean {
  const req = card.requirements;
  const range = card.range === 'infinite' ? RANGE_MAX : card.range;
  return (
    anyOf(f.deck, card.deck) &&
    anyOf(f.rarity, card.rarity) &&
    anyOf(f.class, card.class) &&
    anyOf(f.equip, card.equip) &&
    anyOf(f.hands, card.hands) &&
    atMost(f.strength, req.strength) &&
    atMost(f.dexterity, req.dexterity) &&
    atMost(f.intelligence, req.intelligence) &&
    atMost(f.faith, req.faith) &&
    matchesAttacks(card, f) &&
    atLeast(f.range, range) &&
    matchesDefence(card, f) &&
    atLeast(f.dodge, card.defence.dodge) &&
    atLeast(f.upgradeSlots, card.upgradeSlots)
  );
}
