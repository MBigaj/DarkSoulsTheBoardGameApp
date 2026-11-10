/**
 * Domain types the UI works with: cards after normalization, list/overview shapes,
 * dice, classes and forged encounters. Raw card types are generated from the JSON Schemas.
 */
import type { CardSet, CardType, Die, SetCode } from '@/shared/lib/card-types';
import type {
  RawBehaviour,
  RawBoss,
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

// ── Summaries: what list and overview responses carry (tile fields only) ─────────────────────
// The close-up fetches the full card with getCard().

type Common = '_id' | 'set' | 'type' | 'name' | 'art';

export type TreasureSummary = Pick<
  Treasure,
  Common | 'deck' | 'rarity' | 'class' | 'boss' | 'equip' | 'hands' | 'requirements'
>;
export type EnemySummary = Pick<Enemy, Common | 'threat' | 'health'>;
export type BossSummary = Pick<Boss, Common | 'tier' | 'threat' | 'health'>;
export type BehaviourSummary = Pick<Behaviour, Common | 'boss'>;
export type EncounterSummary = Pick<Encounter, Common | 'level' | 'boss'> & { tileCount: number };
export type EventSummary = Pick<Event, Common | 'eventType'>;

export type CardSummary =
  TreasureSummary | EnemySummary | BossSummary | BehaviourSummary | EncounterSummary | EventSummary;

// ── Queries and responses ────────────────────────────────────────────────────────────────────

export type SortKey = 'id' | 'name';

/**
 * GET /cards. Absent or empty `sets` means every set. Archive filters run on the client
 * (`features/archive/filters`); FE-26 drops these query params.
 */
export type CardQuery = {
  type: CardType;
  sets?: readonly SetCode[];
  /** Matches name or ID, case-insensitive. */
  q?: string;
  /** Default 'id' (`_id` order). 'name' sorts by name, then `_id`. */
  sort?: SortKey;
  /** Opaque; from the previous page's nextCursor. */
  cursor?: string | null;
  /** Default 48, max 100. */
  limit?: number;
};

export type CardPage = {
  items: CardSummary[];
  /** null on the last page. */
  nextCursor: string | null;
  /** Cards matching the whole query. */
  total: number;
  /** Per set, with `q` applied but not `sets`, so the rail can show counts for unticked sets. */
  setCounts: Record<SetCode, number>;
  /** Per type, with `sets` and `q` applied: the tab counts. */
  typeCounts: Record<CardType, number>;
};

export type OverviewQuery = { sets?: readonly SetCode[]; q?: string };

/** GET /cards/overview: one section per type, in CARD_TYPES order. */
export type OverviewSection = {
  type: CardType;
  total: number;
  /** The first 5 in `_id` order. */
  items: CardSummary[];
};

// ── Dice, classes, encounters ────────────────────────────────────────────────────────────────

export type DieFaces = { kind: 'attack' | 'dodge'; faces: number[]; faceMeaning?: string };
export type DiceTable = Record<Die | 'green', DieFaces>;

export type Stat = 'strength' | 'dexterity' | 'intelligence' | 'faith';
/** Base, Tier 1, Tier 2, Tier 3. */
export type StatTrack = [base: number, tier1: number, tier2: number, tier3: number];

export type ClassDef = {
  id: string;
  name: string;
  sets: SetCode[];
  /** null when the track isn't printed (Thief); `statsNote` says why. */
  stats: Record<Stat, StatTrack> | null;
  statsNote?: string;
  /** null until the class dashboard data exists. */
  heroicAction: string | null;
  taunt: number | null;
};

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
