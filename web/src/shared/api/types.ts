/**
 * Domain types the UI works with: cards after normalization, catalog pages,
 * dice, classes and forged encounters. Raw card types are generated from the JSON Schemas.
 */
import type { CardSet, CardType, Die, SetCode } from '@/shared/lib/card-types';
import type {
  RawBehaviour,
  RawBoss,
  RawClass,
  RawEncounter,
  RawEnemy,
  RawEvent,
  RawTreasure,
} from './generated';

export type { CardSet, CardType, Die, SetCode };

/** Dice per colour, e.g. `{ black: 2 }`. A colour that isn't rolled is absent. */
export type DiceCounts = Partial<Record<Die, number>>;

// ── Cards, normalized ────────────────────────────────────────────────────────────────────────
// Normalizing fills defaults the store omits: an absent flag is `false`, an absent list is `[]`.
// `null` (unknown / not applicable) is kept. Type-specific optional fields (`hands`, `range`…)
// stay absent when the card doesn't have them.

type RawAttack = NonNullable<RawTreasure['attacks']>[number];
type RawAbility = NonNullable<RawTreasure['abilities']>[number];
type RawAction = RawEnemy['behaviour'][number];
type RawReward = RawEncounter['rewards'][number];
type RawTile = RawEncounter['tiles'][number];
type RawSpecialRule = NonNullable<RawEncounter['specialRules']>[number];

export type Condition = NonNullable<RawAttack['conditions']>[number];

export type Attack = Omit<
  RawAttack,
  'dice' | 'nodeAttack' | 'shaft' | 'conditions' | 'keywords'
> & {
  dice: DiceCounts;
  nodeAttack: boolean;
  shaft: boolean;
  conditions: Condition[];
  keywords: string[];
};

export type Ability = Omit<RawAbility, 'keywords'> & { keywords: string[] };

export type Treasure = Omit<RawTreasure, 'defence' | 'attacks' | 'abilities' | 'review'> & {
  defence: { block: DiceCounts | null; resist: DiceCounts | null; dodge: number };
  attacks: Attack[];
  abilities: Ability[];
};

export type Action = Omit<RawAction, 'leap' | 'push' | 'nodeAttack' | 'area' | 'conditions'> & {
  leap: boolean;
  push: boolean;
  nodeAttack: boolean;
  area: boolean;
  conditions: Condition[];
};

export type Enemy = Omit<RawEnemy, 'behaviour' | 'keywords'> & {
  behaviour: Action[];
  keywords: string[];
};

export type Boss = Omit<RawBoss, 'rules'> & { rules: NonNullable<RawBoss['rules']> };

type RawSide = NonNullable<RawBehaviour['parts']>[number];
/** One half of a combined card (SC Ornstein & Smough). */
export type BehaviourSide = Omit<RawSide, 'behaviour' | 'heatUp'> & {
  behaviour: Action[];
  heatUp: boolean;
};

/** A single card carries its own `boss`, stats and `arcs`; a combined card carries `parts` instead. */
export type Behaviour = Omit<RawBehaviour, 'behaviour' | 'heatUp' | 'parts'> & {
  behaviour: Action[];
  heatUp: boolean;
  parts: BehaviourSide[];
};

export type Reward = Omit<RawReward, 'plusPlayers'> & { plusPlayers: boolean };
export type SpecialRule = RawSpecialRule;
export type SpecialRuleKeyword = NonNullable<SpecialRule['keyword']>;
/** Setup column: node role → enemy/boss `_id`s or terrain names. Absent roles stay absent. */
export type TileSetup = { [Role in keyof NonNullable<RawTile['setup']>]?: string[] };
export type EncounterTile = Omit<
  RawTile,
  'setup' | 'trapped' | 'isolated' | 'start' | 'markers'
> & {
  setup: TileSetup;
  trapped: boolean;
  isolated: boolean;
  start: NonNullable<RawTile['start']>;
  markers: NonNullable<RawTile['markers']>;
};

type RawTrial = NonNullable<RawEncounter['trial']>;
export type Trial = Omit<RawTrial, 'rewards' | 'plusPlayers'> & {
  rewards: Reward[];
  plusPlayers: boolean;
};

/** A regular encounter has `level`; a boss encounter has `boss` (one id, or a list for O&S). */
export type Encounter = Omit<RawEncounter, 'rewards' | 'trial' | 'specialRules' | 'tiles'> & {
  rewards: Reward[];
  trial?: Trial;
  specialRules: SpecialRule[];
  tiles: EncounterTile[];
};

export type Event = RawEvent;

export type Card = Treasure | Enemy | Boss | Behaviour | Encounter | Event;
export type CardOf<T extends CardType> = Extract<Card, { type: T }>;

// ── Catalog ──────────────────────────────────────────────────────────────────────────────────
// GET /cards pages through the whole catalog in `_id` order. Filtering, search, sort and counts
// run on the client over the cached catalog (architecture decision 4).

export type CardListQuery = {
  /** Only this type; absent = every card. */
  type?: CardType;
  /** Opaque; from the previous page's nextCursor. */
  cursor?: string | null;
  /** Default 48, max 100. */
  limit?: number;
};

export type CardPage = {
  items: Card[];
  /** null on the last page. */
  nextCursor: string | null;
  /** Cards matching `type` (or all cards). */
  total: number;
  /** Catalog version, the same value as the ETag; changes whenever the data does. */
  version: string;
};

// ── Dice, classes, encounters ────────────────────────────────────────────────────────────────

export type DieFaces = { kind: 'attack' | 'dodge'; faces: number[]; faceMeaning?: string };
export type DiceTable = Record<Die | 'green', DieFaces>;

export type Stat = 'strength' | 'dexterity' | 'intelligence' | 'faith';
/** Base, Tier 1, Tier 2, Tier 3. */
/**
 * Class dashboard (`classes/*.json` in the store, not a card): taunt, heroic ability and stat
 * tracks [base, tier 1, tier 2, tier 3]. `_id` matches `class` on treasure cards.
 */
export type ClassDef = RawClass;

export type EncounterLevel = 1 | 2 | 3;
export type Objective = 'slay' | 'survive' | 'exit';

export type ForgeRequest = {
  mode: 'difficulty' | 'custom';
  level: EncounterLevel;
  partySize: 1 | 2 | 3 | 4;
  sets: SetCode[];
  /** Custom mode only. */
  tiles?: 1 | 2 | 3 | 4;
  objective?: Objective;
  trial?: boolean;
};

export type NodeKind = 'start' | 'spawn' | 'terrain' | 'doorway' | 'exit';
export type NodeRef = { tile: number; r: number; c: number };

/** A generated encounter. Draft contract: agree with the backend before M6. No seed, ever. */
export type ForgedEncounter = {
  id: string;
  level: EncounterLevel;
  partySize: 1 | 2 | 3 | 4;
  sets: SetCode[];
  objective: Objective;
  trial?: { objective: string };
  specialRules: { keyword: string; text?: string }[];
  tiles: {
    tile: number;
    at: [row: number, col: number];
    nodes: { r: number; c: number; kind: NodeKind; ref?: string }[];
  }[];
  doors: { from: NodeRef; to: NodeRef }[];
  enemies: { enemyId: string; tile: number }[];
  terrain: { name: string; tile: number }[];
};
