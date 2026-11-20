/**
 * Domain types the UI works with: cards after normalization, catalog pages,
 * dice, classes and forged encounters. Raw card types are generated from the JSON Schemas.
 */
import type { CardSet, CardType, Die, SetCode } from '@/shared/lib/card-types';
import type {
  RawBack,
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

/** What an upgrade adds to attacks (`attackBonus` on upgrade cards), for the damage calculator. */
export type AttackBonus = NonNullable<RawTreasure['attackBonus']>[number];
export type BonusCondition = NonNullable<AttackBonus['condition']>;

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

// ── Forge (PROVISIONAL) ──────────────────────────────────────────────────────────────────────
// Draft contract from the frontend plan (FE-18). The real shape is agreed with the backend in
// BE-08, after the remaining scans; revise these types then. Never a seed or a model version.

/** By difficulty: the generator picks tiles, objective and Trial. Custom: the player does. */
export type ForgeRequest =
  | { mode: 'difficulty'; level: EncounterLevel; partySize: PartySize; sets: SetCode[] }
  | {
      mode: 'custom';
      level: EncounterLevel;
      partySize: PartySize;
      sets: SetCode[];
      tiles: 1 | 2 | 3 | 4;
      objective: Objective;
      trial: boolean;
    };

export type PartySize = 1 | 2 | 3 | 4;
/** Terrain tokens (the card schema's setup terrain names). */
export type TerrainName =
  'barrel' | 'chest' | 'envoyBanner' | 'fangBoar' | 'gravestone' | 'lever' | 'shrine' | 'torch';
/** Which of a tile's two printed spawn nodes. */
export type SpawnRole = 'primary' | 'secondary';

/**
 * A node on a placed tile, after turning. `r`, `c` are on the 5 × 5 lattice where only r + c even
 * exists; a quarter turn maps (r, c) → (c, 4 − r). Spawn and terrain nodes are the tile's printed
 * ones, turned.
 */
export type ForgedNode = { r: number; c: number } & (
  | { kind: 'start' | 'doorway' | 'exit' }
  | { kind: 'spawn'; ref: SpawnRole }
  | { kind: 'terrain'; ref: TerrainName }
);
export type NodeKind = ForgedNode['kind'];

/** `tile` = the tile's number on this map (1 = where the party starts), as in "TILE 2 · SC 3B". */
export type ForgedTile = {
  tile: number;
  /** Store tile side, e.g. "sc-tile-3b". */
  tileId: string;
  /** Clockwise quarter turns applied to the tile's art and nodes. */
  turns: 0 | 1 | 2 | 3;
  at: [row: number, col: number];
  nodes: ForgedNode[];
};
export type NodeRef = { tile: number; r: number; c: number };

/** A generated encounter (PROVISIONAL, see above). */
export type ForgedEncounter = {
  id: string;
  level: EncounterLevel;
  partySize: PartySize;
  sets: SetCode[];
  objective: Objective;
  trial?: { objective: string };
  /** Same shape as on encounter cards: a keyword (with `n` for Timer) or free text. */
  specialRules: SpecialRule[];
  tiles: ForgedTile[];
  /** Two doorway nodes on neighbouring tiles that face each other. */
  doors: { from: NodeRef; to: NodeRef }[];
  enemies: { enemyId: string; tile: number; spawn: SpawnRole }[];
  terrain: { name: TerrainName; tile: number }[];
};

/** A deck's card back (`backs/{set}/*.json`); `backFor` in lib/backs.ts picks a card's. */
export type CardBack = RawBack;
