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

const isCell = (v: unknown): v is [number, number] =>
  Array.isArray(v) && v.length === 2 && v.every((x) => Number.isInteger(x));

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Counts of each value, for comparing two lists as multisets. */
const tally = (values: readonly string[]) =>
  values.reduce((counts, v) => counts.set(v, (counts.get(v) ?? 0) + 1), new Map<string, number>());

const sameTally = (a: readonly string[], b: readonly string[]) => {
  const ta = tally(a);
  const tb = tally(b);
  return ta.size === tb.size && [...ta].every(([v, n]) => tb.get(v) === n);
};

/**
 * Everything wrong with a forged encounter, as sentences; empty when it fits the contract. Never
 * throws: it is the only check on untyped JSON (fixtures now, BE-08 responses later), so a missing
 * or malformed field is reported and skipped. Checks: shape, the node lattice, doors between facing
 * doorways of neighbouring tiles, every tile reachable from tile 1 through doors (tiles − 1 doors),
 * start nodes on tile 1 only, one exit on the last tile, enemies from the encounter's sets on their
 * tile's spawn nodes with the count rule, terrain pieces and terrain nodes matching 1:1 per tile,
 * each physical tile used once.
 */
export function encounterProblems(value: unknown): string[] {
  const problems: string[] = [];
  const say = (text: string) => problems.push(text);
  if (!isObject(value)) return ['not an object'];
  const e = value as Partial<ForgedEncounter>;

  if (typeof e.id !== 'string' || e.id === '') say('id must be a non-empty string');
  if (!isInt(e.level, 1, 3)) say('level must be 1, 2 or 3');
  if (!isInt(e.partySize, 1, 4)) say('partySize must be 1–4');
  const sets = Array.isArray(e.sets) ? e.sets : [];
  if (sets.length === 0 || !sets.every((s) => SET_CODES.includes(s)))
    say('sets must list sc, tog or pwa');
  if (!['slay', 'survive', 'exit'].includes(e.objective as string))
    say('objective must be slay, survive or exit');
  if (e.trial !== undefined && (!isObject(e.trial) || typeof e.trial.objective !== 'string'))
    say('trial needs an objective');
  if (!Array.isArray(e.specialRules)) say('specialRules must be a list');
  if (!Array.isArray(e.tiles) || e.tiles.length < 1 || e.tiles.length > 4) {
    return [...problems, 'tiles must hold 1–4 tiles'];
  }
  const tileCount = e.tiles.length;
  const lists = { doors: e.doors, enemies: e.enemies, terrain: e.terrain };
  for (const [name, list] of Object.entries(lists)) {
    if (!Array.isArray(list)) say(`${name} must be a list`);
  }
  const doors = Array.isArray(e.doors) ? e.doors.filter(isObject) : [];
  const enemies = Array.isArray(e.enemies) ? e.enemies.filter(isObject) : [];
  const terrain = Array.isArray(e.terrain) ? e.terrain.filter(isObject) : [];

  // Tiles whose nodes and position could be read; the rest are reported and left out.
  const tiles: ForgedTile[] = [];
  const physical = new Set<string>();
  const positions = new Set<string>();
  e.tiles.forEach((raw: unknown, i) => {
    const name = `tile ${String(i + 1)}`;
    if (!isObject(raw)) {
      say(`${name}: not an object`);
      return;
    }
    const tile = raw as Partial<ForgedTile>;
    if (tile.tile !== i + 1) say(`${name}: tile must be numbered ${String(i + 1)}`);
    const id = TILE_ID.exec(typeof tile.tileId === 'string' ? tile.tileId : '');
    if (!id) say(`${name}: tileId "${String(tile.tileId)}" isn't a tile side`);
    else {
      const key = `${id[1] ?? ''}-${id[2] ?? ''}`;
      if (physical.has(key)) say(`${name}: physical tile ${key} is already on the map`);
      physical.add(key);
    }
    if (!isInt(tile.turns, 0, 3)) say(`${name}: turns must be 0–3`);
    if (!isCell(tile.at)) say(`${name}: at must be two integers [row, col]`);
    else {
      const at = tile.at.join(',');
      if (positions.has(at)) say(`${name}: another tile is already at [${at}]`);
      positions.add(at);
    }
    if (!Array.isArray(tile.nodes)) {
      say(`${name}: nodes must be a list`);
      return;
    }
    const nodes = tile.nodes.filter(isObject);
    if (nodes.length !== tile.nodes.length) say(`${name}: every node must be an object`);
    const seen = new Set<string>();
    for (const node of nodes) {
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
      if (node.kind === 'exit' && i !== tileCount - 1)
        say(`${where}: the exit belongs on the last tile`);
    }
    if (isCell(tile.at)) tiles.push({ ...(tile as ForgedTile), tile: i + 1, nodes });
  });
  const kinds = tiles.flatMap((t) => t.nodes.map((n) => n.kind));
  if (!kinds.includes('start')) say('no start nodes');
  if (kinds.filter((k) => k === 'exit').length !== 1) say('there must be exactly one exit');

  const tileNo = (n: unknown) => tiles.find((t) => t.tile === n);
  const doored = new Set<string>();
  const links = new Map<number, number[]>();
  for (const { from, to } of doors as { from: unknown; to: unknown }[]) {
    if (!isObject(from) || !isObject(to)) {
      say('every door needs from and to');
      continue;
    }
    const a = tileNo(from.tile);
    const b = tileNo(to.tile);
    const name = `door ${String(from.tile)}→${String(to.tile)}`;
    if (!a || !b) {
      say(`${name}: unknown tile`);
      continue;
    }
    const [fr, fc, tr, tc] = [from.r, from.c, to.r, to.c].map(Number) as [
      number,
      number,
      number,
      number,
    ];
    const step: [number, number] = [b.at[0] - a.at[0], b.at[1] - a.at[1]];
    const out = doorwaySide([fr, fc]);
    const back = doorwaySide([tr, tc]);
    if (nodeAt(a, fr, fc)?.kind !== 'doorway' || nodeAt(b, tr, tc)?.kind !== 'doorway')
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
    doored.add(`${String(a.tile)}:${String(fr)},${String(fc)}`);
    doored.add(`${String(b.tile)}:${String(tr)},${String(tc)}`);
    links.set(a.tile, [...(links.get(a.tile) ?? []), b.tile]);
    links.set(b.tile, [...(links.get(b.tile) ?? []), a.tile]);
  }
  for (const tile of tiles) {
    for (const n of tile.nodes) {
      if (n.kind === 'doorway' && !doored.has(`${String(tile.tile)}:${String(n.r)},${String(n.c)}`))
        say(`tile ${String(tile.tile)} doorway [${String(n.r)}, ${String(n.c)}] has no door`);
    }
  }
  // One path through the map: tiles − 1 doors, and every tile reachable from tile 1.
  if (Array.isArray(e.doors) && e.doors.length !== e.tiles.length - 1)
    say(
      `expected ${String(e.tiles.length - 1)} doors for ${String(e.tiles.length)} tiles, found ${String(e.doors.length)}`,
    );
  const reached = new Set<number>([1]);
  const queue = [1];
  while (queue.length > 0) {
    for (const next of links.get(queue.shift() ?? 0) ?? []) {
      if (!reached.has(next)) {
        reached.add(next);
        queue.push(next);
      }
    }
  }
  for (let n = 1; n <= e.tiles.length; n++) {
    if (!reached.has(n)) say(`tile ${String(n)} is not connected to tile 1 by doors`);
  }

  for (const enemy of enemies as Partial<ForgedEncounter['enemies'][number]>[]) {
    const id = typeof enemy.enemyId === 'string' ? enemy.enemyId : '';
    const set = ENEMY_ID.exec(id)?.[1];
    if (!set) say(`enemy "${id}" isn't an enemy id`);
    else if (!sets.includes(set as (typeof sets)[number]))
      say(`enemy ${id}: its set (${set}) isn't one of the encounter's sets`);
    if (!tileNo(enemy.tile)?.nodes.some((n) => n.kind === 'spawn' && n.ref === enemy.spawn))
      say(`enemy ${id}: tile ${String(enemy.tile)} has no ${String(enemy.spawn)} spawn node`);
  }
  if (isInt(e.level, 1, 3) && isInt(e.partySize, 1, 4)) {
    const expected = enemyCount(e.partySize, e.level, e.tiles.length);
    if (enemies.length !== expected)
      say(`expected ${String(expected)} enemies, found ${String(enemies.length)}`);
  }
  if (enemies.filter((x) => x.tile === 1).length !== 1) say('tile 1 must hold exactly one enemy');

  // Each terrain node is a token on the map, so pieces and nodes match 1:1 per tile.
  const pieces = terrain as Partial<ForgedEncounter['terrain'][number]>[];
  for (const piece of pieces) {
    if (!tileNo(piece.tile))
      say(`terrain ${String(piece.name)}: unknown tile ${String(piece.tile)}`);
  }
  for (const tile of tiles) {
    const onNodes = tile.nodes.flatMap((n) => (n.kind === 'terrain' ? [n.ref] : []));
    const listed = pieces.flatMap((p) => (p.tile === tile.tile ? [String(p.name)] : []));
    if (!sameTally(onNodes, listed))
      say(
        `tile ${String(tile.tile)}: terrain nodes [${onNodes.join(', ')}] don't match terrain [${listed.join(', ')}]`,
      );
  }
  return problems;
}
