/**
 * Forge controls rail state (ForgeFinal). The request sent is built from it by `toRequest`, so what
 * the rail shows is what the generator gets. Pure.
 */
import type {
  EncounterLevel,
  ForgedEncounter,
  ForgeRequest,
  Objective,
  PartySize,
} from '@/shared/api/types';
import type { SetCode } from '@/shared/lib/card-types';

export type ForgeMode = ForgeRequest['mode'];
export type TileCount = 1 | 2 | 3 | 4;

/**
 * `tiles`, `objective` and `trial` are only sent in Custom mode, but kept in both so switching back
 * and forth loses nothing. `touched`: the player has changed something since the page opened, so a
 * loaded encounter (/forge/:id) no longer overwrites the rail.
 */
export type ForgeControls = {
  mode: ForgeMode;
  level: EncounterLevel;
  partySize: PartySize;
  /** The enemy pool, in rail order. Empty = nothing to forge from (the button is disabled). */
  sets: SetCode[];
  tiles: TileCount;
  objective: Objective;
  trial: boolean;
  touched: boolean;
};

/** Rail order of the pool (canvas): Tomb of Giants, Painted World, Sunless City. */
export const POOL_ORDER: readonly SetCode[] = ['tog', 'pwa', 'sc'];

/** Difficulty cards: what the generator picks per level (project context §5; names are placeholders). */
export const DIFFICULTIES: readonly {
  level: EncounterLevel;
  name: string;
  summary: string;
}[] = [
  { level: 1, name: 'Wandering', summary: '1–2 tiles · 1 special rule · no Trial' },
  { level: 2, name: 'Perilous', summary: '2–3 tiles · 2 special rules · Trial possible' },
  { level: 3, name: 'Deadly', summary: '3–4 tiles · 2 special rules · Trial likely' },
];

export const INITIAL_CONTROLS: ForgeControls = {
  mode: 'difficulty',
  level: 2,
  partySize: 3,
  sets: [...POOL_ORDER],
  tiles: 3,
  objective: 'exit',
  trial: false,
  touched: false,
};

export type ControlsAction =
  /** Switching to Custom carries over what the shown encounter (if any) was forged with. */
  | { type: 'setMode'; mode: ForgeMode; shown?: ForgedEncounter }
  | { type: 'setLevel'; level: EncounterLevel }
  | { type: 'setPartySize'; partySize: PartySize }
  | { type: 'toggleSet'; set: SetCode }
  | { type: 'setTiles'; tiles: TileCount }
  | { type: 'setObjective'; objective: Objective }
  | { type: 'setTrial'; trial: boolean }
  /** An encounter opened by link fills an untouched rail with its settings. */
  | { type: 'load'; encounter: ForgedEncounter };

const tileCount = (n: number): TileCount => Math.min(4, Math.max(1, n)) as TileCount;

/** What an encounter was forged with, as Custom values. */
function customFrom(encounter: ForgedEncounter) {
  return {
    tiles: tileCount(encounter.tiles.length),
    objective: encounter.objective,
    trial: encounter.trial !== undefined,
  };
}

export function controlsReducer(state: ForgeControls, action: ControlsAction): ForgeControls {
  const touched = { ...state, touched: true };
  switch (action.type) {
    case 'setMode':
      if (action.mode === state.mode) return state;
      return action.mode === 'custom' && action.shown
        ? { ...touched, mode: 'custom', ...customFrom(action.shown) }
        : { ...touched, mode: action.mode };
    case 'setLevel':
      return { ...touched, level: action.level };
    case 'setPartySize':
      return { ...touched, partySize: action.partySize };
    case 'toggleSet': {
      const on = state.sets.includes(action.set);
      const sets = POOL_ORDER.filter((s) => (s === action.set ? !on : state.sets.includes(s)));
      return { ...touched, sets };
    }
    case 'setTiles':
      return { ...touched, tiles: action.tiles };
    case 'setObjective':
      return { ...touched, objective: action.objective };
    case 'setTrial':
      return { ...touched, trial: action.trial };
    case 'load': {
      if (state.touched) return state;
      const { encounter } = action;
      return {
        ...state,
        level: encounter.level,
        partySize: encounter.partySize,
        sets: POOL_ORDER.filter((s) => encounter.sets.includes(s)),
        ...customFrom(encounter),
      };
    }
  }
}

/** The request for the rail as shown; null while the pool is empty (nothing to forge from). */
export function toRequest(state: ForgeControls): ForgeRequest | null {
  if (state.sets.length === 0) return null;
  const shared = { level: state.level, partySize: state.partySize, sets: [...state.sets] };
  return state.mode === 'custom'
    ? {
        mode: 'custom',
        ...shared,
        tiles: state.tiles,
        objective: state.objective,
        trial: state.trial,
      }
    : { mode: 'difficulty', ...shared };
}
