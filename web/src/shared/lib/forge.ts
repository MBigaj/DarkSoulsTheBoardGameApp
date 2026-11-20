/**
 * Forge geometry and checks for `ForgedEncounter` (PROVISIONAL contract, see api/types.ts). Pure.
 * Fixtures are untyped JSON, so `encounterProblems` is what proves they fit the contract.
 */
import type {
  EncounterLevel,
  ForgedEncounter,
  ForgedNode,
  ForgedTile,
  NodeKind,
  SpawnRole,
  TerrainName,
} from '@/shared/api/types';
import { SET_CODES } from './card-types';

export type Cell = readonly [r: number, c: number];

/** `turns` clockwise quarter turns of a node on the 5 × 5 lattice: (r, c) → (c, 4 − r) each. */
export function turnNode([r, c]: Cell, turns: number): [number, number] {
  let at: [number, number] = [r, c];
  for (let i = 0; i < ((turns % 4) + 4) % 4; i++) at = [at[1], 4 - at[0]];
  return at;
}

/** The map direction a doorway node faces: [row step, col step], or null if it's not an edge midpoint. */
export function doorwaySide([r, c]: Cell): [number, number] | null {
  if (r === 0 && c === 2) return [-1, 0];
  if (r === 2 && c === 4) return [0, 1];
  if (r === 4 && c === 2) return [1, 0];
  if (r === 2 && c === 0) return [0, -1];
  return null;
}

/** Enemies for a forged encounter: party + level + tiles − 1, at most 10 (project context §5). */
export function enemyCount(partySize: number, level: EncounterLevel, tiles: number): number {
  return Math.min(10, partySize + level + tiles - 1);
}

const KINDS: readonly NodeKind[] = ['start', 'spawn', 'terrain', 'doorway', 'exit'];
const SPAWNS: readonly SpawnRole[] = ['primary', 'secondary'];
const TERRAIN: readonly TerrainName[] = [
  'barrel',
  'chest',
  'envoyBanner',
  'fangBoar',
  'gravestone',
  'lever',
  'shrine',
  'torch',
];
const TILE_ID = /^(sc|tog|pwa)-tile-([1-9])([ab])$/;
const ENEMY_ID = /^(sc|tog|pwa)-enemy-[a-z0-9-]+$/;

const isInt = (v: unknown, min: number, max: number): v is number =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max;

const nodeAt = (tile: ForgedTile, r: number, c: number): ForgedNode | undefined =>
  tile.nodes.find((n) => n.r === r && n.c === c);

/**
 * Everything wrong with a forged encounter, as sentences; empty when it fits the contract:
 * shape, the node lattice, doors between facing doorways of neighbouring tiles, start nodes on
 * tile 1 only, one exit on the last tile, enemies on their tile's spawn nodes with the count rule,
 * terrain on terrain nodes, each physical tile used once.
 */
export function encounterProblems(value: unknown): string[] {
  const problems: string[] = [];
  const say = (text: string) => problems.push(text);
  if (typeof value !== 'object' || value === null) return ['not an object'];
  const e = value as ForgedEncounter;

  if (typeof e.id !== 'string' || e.id === '') say('id must be a non-empty string');
  if (!isInt(e.level, 1, 3)) say('level must be 1, 2 or 3');
  if (!isInt(e.partySize, 1, 4)) say('partySize must be 1–4');
  if (!Array.isArray(e.sets) || e.sets.length === 0 || !e.sets.every((s) => SET_CODES.includes(s)))
    say('sets must list sc, tog or pwa');
  if (!['slay', 'survive', 'exit'].includes(e.objective))
    say('objective must be slay, survive or exit');
  if (e.trial !== undefined && typeof e.trial.objective !== 'string')
    say('trial needs an objective');
  if (!Array.isArray(e.specialRules)) say('specialRules must be a list');
  if (!Array.isArray(e.tiles) || e.tiles.length < 1 || e.tiles.length > 4) {
    return [...problems, 'tiles must hold 1–4 tiles'];
  }

  const physical = new Set<string>();
  const positions = new Set<string>();
  e.tiles.forEach((tile, i) => {
    const name = `tile ${String(i + 1)}`;
    if (tile.tile !== i + 1) say(`${name}: tile must be numbered ${String(i + 1)}`);
    const id = TILE_ID.exec(tile.tileId);
    if (!id) say(`${name}: tileId "${tile.tileId}" isn't a tile side`);
    else {
      const key = `${id[1] ?? ''}-${id[2] ?? ''}`;
      if (physical.has(key)) say(`${name}: physical tile ${key} is already on the map`);
      physical.add(key);
    }
    if (!isInt(tile.turns, 0, 3)) say(`${name}: turns must be 0–3`);
    const at = `${String(tile.at[0])},${String(tile.at[1])}`;
    if (positions.has(at)) say(`${name}: another tile is already at [${at}]`);
    positions.add(at);

    const seen = new Set<string>();
    for (const node of tile.nodes) {
      const where = `${name} node [${String(node.r)}, ${String(node.c)}]`;
      if (!isInt(node.r, 0, 4) || !isInt(node.c, 0, 4) || (node.r + node.c) % 2 !== 0)
        say(`${where}: not on the lattice (r + c must be even)`);
      if (seen.has(`${String(node.r)},${String(node.c)}`)) say(`${where}: two nodes in one place`);
      seen.add(`${String(node.r)},${String(node.c)}`);
      if (!KINDS.includes(node.kind)) say(`${where}: unknown kind`);
      if (node.kind === 'spawn' && !SPAWNS.includes(node.ref))
        say(`${where}: spawn needs primary or secondary`);
      if (node.kind === 'terrain' && !TERRAIN.includes(node.ref)) say(`${where}: unknown terrain`);
      if ((node.kind === 'doorway' || node.kind === 'exit') && !doorwaySide([node.r, node.c]))
        say(`${where}: ${node.kind} must be an edge midpoint`);
      if (node.kind === 'start' && i !== 0) say(`${where}: start nodes belong on tile 1`);
      if (node.kind === 'exit' && i !== e.tiles.length - 1)
        say(`${where}: the exit belongs on the last tile`);
    }
  });
  const kinds = e.tiles.flatMap((t) => t.nodes.map((n) => n.kind));
  if (!kinds.includes('start')) say('no start nodes');
  if (kinds.filter((k) => k === 'exit').length !== 1) say('there must be exactly one exit');

  const tileNo = (n: number) => e.tiles[n - 1];
  const doored = new Set<string>();
  for (const { from, to } of e.doors) {
    const a = tileNo(from.tile);
    const b = tileNo(to.tile);
    const name = `door ${String(from.tile)}→${String(to.tile)}`;
    if (!a || !b) {
      say(`${name}: unknown tile`);
      continue;
    }
    const step: [number, number] = [b.at[0] - a.at[0], b.at[1] - a.at[1]];
    const out = doorwaySide([from.r, from.c]);
    const back = doorwaySide([to.r, to.c]);
    if (nodeAt(a, from.r, from.c)?.kind !== 'doorway' || nodeAt(b, to.r, to.c)?.kind !== 'doorway')
      say(`${name}: both ends must be doorway nodes`);
    if (
      !out ||
      !back ||
      out[0] !== step[0] ||
      out[1] !== step[1] ||
      back[0] !== -step[0] ||
      back[1] !== -step[1]
    )
      say(`${name}: the doorways must face each other across neighbouring tiles`);
    doored.add(`${String(from.tile)}:${String(from.r)},${String(from.c)}`);
    doored.add(`${String(to.tile)}:${String(to.r)},${String(to.c)}`);
  }
  e.tiles.forEach((tile) => {
    for (const n of tile.nodes) {
      if (n.kind === 'doorway' && !doored.has(`${String(tile.tile)}:${String(n.r)},${String(n.c)}`))
        say(`tile ${String(tile.tile)} doorway [${String(n.r)}, ${String(n.c)}] has no door`);
    }
  });

  for (const enemy of e.enemies) {
    const tile = tileNo(enemy.tile);
    if (!ENEMY_ID.test(enemy.enemyId)) say(`enemy "${enemy.enemyId}" isn't an enemy id`);
    if (!tile?.nodes.some((n) => n.kind === 'spawn' && n.ref === enemy.spawn))
      say(`enemy ${enemy.enemyId}: tile ${String(enemy.tile)} has no ${enemy.spawn} spawn node`);
  }
  if (isInt(e.level, 1, 3) && e.enemies.length !== enemyCount(e.partySize, e.level, e.tiles.length))
    say(
      `expected ${String(enemyCount(e.partySize, e.level, e.tiles.length))} enemies, found ${String(e.enemies.length)}`,
    );
  if (e.enemies.filter((x) => x.tile === 1).length !== 1) say('tile 1 must hold exactly one enemy');

  for (const piece of e.terrain) {
    if (!tileNo(piece.tile)?.nodes.some((n) => n.kind === 'terrain' && n.ref === piece.name))
      say(`terrain ${piece.name}: no matching terrain node on tile ${String(piece.tile)}`);
  }
  return problems;
}
