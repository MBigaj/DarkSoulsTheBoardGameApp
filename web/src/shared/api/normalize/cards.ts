/**
 * Raw card JSON → domain cards. The store omits defaults; these fill them:
 * an absent flag becomes `false`, an absent list becomes `[]`.
 * `null` means "unknown" and is never replaced, so every default checks for `undefined` only
 * (no `??`, which would also replace null).
 */
import { DICE } from '@/shared/lib/card-types';
import type {
  RawBehaviour,
  RawBoss,
  RawEncounter,
  RawEnemy,
  RawEvent,
  RawTreasure,
} from '../generated';
import type {
  Action,
  Behaviour,
  Boss,
  Card,
  DiceCounts,
  Encounter,
  Enemy,
  Event,
  Reward,
  Treasure,
} from '../types';

export type RawCard = RawTreasure | RawEnemy | RawBoss | RawBehaviour | RawEncounter | RawEvent;

const flag = (value: true | undefined): boolean => value === true;

function list<T>(value: readonly T[] | undefined): T[] {
  return value === undefined ? [] : [...value];
}

/** Keeps only the known dice; null (unknown) passes through. */
function dice(value: Record<string, number | undefined>): DiceCounts;
function dice(value: Record<string, number | undefined> | null): DiceCounts | null;
function dice(value: Record<string, number | undefined> | null): DiceCounts | null {
  if (value === null) return null;
  const out: DiceCounts = {};
  for (const die of DICE) {
    const count = value[die];
    if (count !== undefined) out[die] = count;
  }
  return out;
}

export function normalizeTreasure(raw: RawTreasure): Treasure {
  // `review` holds data-prep notes; the UI never shows them.
  const { review: _review, attacks, abilities, defence, ...rest } = raw;
  return {
    ...rest,
    defence: { ...defence, block: dice(defence.block), resist: dice(defence.resist) },
    attacks: list(attacks).map((attack) => ({
      ...attack,
      dice: dice(attack.dice),
      nodeAttack: flag(attack.nodeAttack),
      shaft: flag(attack.shaft),
      conditions: list(attack.conditions),
      keywords: list(attack.keywords),
    })),
    abilities: list(abilities).map((ability) => ({
      ...ability,
      keywords: list(ability.keywords),
    })),
  };
}

function normalizeAction(raw: RawEnemy['behaviour'][number]): Action {
  return {
    ...raw,
    leap: flag(raw.leap),
    push: flag(raw.push),
    nodeAttack: flag(raw.nodeAttack),
    area: flag(raw.area),
    conditions: list(raw.conditions),
  };
}

export function normalizeEnemy(raw: RawEnemy): Enemy {
  return {
    ...raw,
    behaviour: raw.behaviour.map(normalizeAction),
    keywords: list(raw.keywords),
  };
}

export function normalizeBoss(raw: RawBoss): Boss {
  return { ...raw, rules: list(raw.rules) };
}

export function normalizeBehaviour(raw: RawBehaviour): Behaviour {
  return {
    ...raw,
    behaviour: raw.behaviour.map(normalizeAction),
    heatUp: flag(raw.heatUp),
  };
}

function normalizeReward(raw: RawEncounter['rewards'][number]): Reward {
  return { ...raw, plusPlayers: flag(raw.plusPlayers) };
}

export function normalizeEncounter(raw: RawEncounter): Encounter {
  const { trial, ...rest } = raw;
  return {
    ...rest,
    ...(trial === undefined
      ? {}
      : { trial: { ...trial, rewards: trial.rewards.map(normalizeReward) } }),
    rewards: raw.rewards.map(normalizeReward),
    specialRules: list(raw.specialRules),
    tiles: raw.tiles.map((tile) => ({
      ...tile,
      setup: list(tile.setup),
      trapped: flag(tile.trapped),
      exit: flag(tile.exit),
    })),
  };
}

export function normalizeEvent(raw: RawEvent): Event {
  return { ...raw };
}

export function normalizeCard(raw: RawCard): Card {
  switch (raw.type) {
    case 'treasure':
      return normalizeTreasure(raw);
    case 'enemy':
      return normalizeEnemy(raw);
    case 'boss':
      return normalizeBoss(raw);
    case 'behaviour':
      return normalizeBehaviour(raw);
    case 'encounter':
      return normalizeEncounter(raw);
    case 'event':
      return normalizeEvent(raw);
  }
}
