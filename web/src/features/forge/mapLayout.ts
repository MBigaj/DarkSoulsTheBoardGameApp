/**
 * Layout for the encounter map (ForgeFinal): where each placed tile, doorway connector and node
 * goes. Tiles sit on a CSS grid with a narrow track between neighbours for the connectors; nodes
 * sit on each tile's 5 × 5 lattice, already turned by the generator.
 *
 * Grid tracks: columns go tile, gap, tile…; rows go header, art, gap, header, art… A tile spans
 * its header and art rows (a two-row subgrid), so a bar between side-by-side tiles sits in the
 * art row and meets the doorways, whatever the header's height.
 */
import type {
  ForgedEncounter,
  ForgedNode,
  ForgedTile,
  SetCode,
  TerrainName,
} from '@/shared/api/types';
import { SET_CODES, SET_NAMES } from '@/shared/lib/card-types';

/** Grid column of a tile at map col: tiles take odd tracks, connectors the even ones. */
const columnTrack = (col: number) => 2 * col + 1;
/** Grid row of a tile's header at map row; its art is the next row, then a gap row. */
const headerTrack = (row: number) => 3 * row + 1;

export type MapGrid = {
  columns: number;
  rows: number;
  /** Grid column and header row (1-based) of each tile, by map tile number; it spans 2 rows. */
  cells: Map<number, { column: number; row: number }>;
};

/** Tile `at` [row, col] → grid placement. Columns and rows count tiles, not tracks. */
export function mapGrid(tiles: readonly ForgedTile[]): MapGrid {
  const cells = new Map<number, { column: number; row: number }>();
  let columns = 0;
  let rows = 0;
  for (const tile of tiles) {
    const [row, col] = tile.at;
    cells.set(tile.tile, { column: columnTrack(col), row: headerTrack(row) });
    columns = Math.max(columns, col + 1);
    rows = Math.max(rows, row + 1);
  }
  return { columns, rows, cells };
}

/** A doorway connector in the gap between two neighbouring tiles. */
export type Connector = {
  column: number;
  row: number;
  /** across = a horizontal bar between side-by-side tiles; down = vertical, between stacked ones. */
  axis: 'across' | 'down';
};

/**
 * Doors → connectors. A door joins two doorway nodes on neighbouring tiles; anything else (a
 * missing tile, tiles that don't touch) draws nothing rather than a bar in the wrong place.
 */
export function connectors(encounter: Pick<ForgedEncounter, 'tiles' | 'doors'>): Connector[] {
  const at = new Map(encounter.tiles.map((tile) => [tile.tile, tile.at]));
  const out: Connector[] = [];
  for (const { from, to } of encounter.doors) {
    const a = at.get(from.tile);
    const b = at.get(to.tile);
    if (!a || !b) continue;
    const [ra, ca] = a;
    const [rb, cb] = b;
    if (ra === rb && Math.abs(ca - cb) === 1) {
      // In the art row, level with the doorways.
      out.push({ column: 2 * Math.min(ca, cb) + 2, row: headerTrack(ra) + 1, axis: 'across' });
    } else if (ca === cb && Math.abs(ra - rb) === 1) {
      // In the gap row below the upper tile.
      out.push({ column: columnTrack(ca), row: headerTrack(Math.min(ra, rb)) + 2, axis: 'down' });
    }
  }
  return out;
}

/** Node (r, c) centre as a fraction of the tile: ((c + 1) / 6, (r + 1) / 6) (handoff). */
export function nodeCentre(r: number, c: number): { x: number; y: number } {
  return { x: (c + 1) / 6, y: (r + 1) / 6 };
}

/** "sc-tile-3b" → set and printed code, for "TILE 2 · SC 3B" and the art path. */
export function tileParts(tileId: string): { set: SetCode; code: string } | null {
  const [, setPart, code] = /^(sc|tog|pwa)-tile-(\d+[ab])$/.exec(tileId) ?? [];
  const set = SET_CODES.find((s) => s === setPart);
  return set && code ? { set, code: code.toUpperCase() } : null;
}

/** "sc-tile-3b" → "SC 3B" (unknown ids are shown as they are). */
export function tileLabel(tileId: string): string {
  const parts = tileParts(tileId);
  return parts ? `${SET_NAMES[parts.set].short} ${parts.code}` : tileId;
}

/** Art key of a tile side (store layout `images/tiles/{set}/{n}{a|b}.png`). */
export function tileArt(tileId: string): string | null {
  const parts = tileParts(tileId);
  return parts ? `tiles/${parts.set}/${parts.code.toLowerCase()}.png` : null;
}

const TERRAIN_NAMES: Record<TerrainName, string> = {
  barrel: 'Barrel',
  chest: 'Chest',
  envoyBanner: 'Envoy banner',
  fangBoar: 'Fang boar',
  gravestone: 'Gravestone',
  lever: 'Lever',
  shrine: 'Shrine',
  torch: 'Torch',
};

export function terrainName(name: TerrainName): string {
  return TERRAIN_NAMES[name];
}

/** A node as drawn: its kind, centre and the label inside the marker ('' for none). */
export type Marker = { kind: ForgedNode['kind']; x: number; y: number; label: string };

/**
 * Markers per map tile. Enemies are numbered 1… in `enemies` order (the roster uses the same
 * numbers); a spawn node shows the numbers of the enemies on it ("2,3"), and an empty one isn't
 * drawn. Terrain shows its
 * initial. When the party outnumbers the start nodes, the extra characters share them and each
 * shared node shows how many start there.
 */
export function markers(encounter: ForgedEncounter): Map<number, Marker[]> {
  const onSpawn = new Map<string, number[]>();
  encounter.enemies.forEach((enemy, i) => {
    const key = `${String(enemy.tile)}:${enemy.spawn}`;
    onSpawn.set(key, [...(onSpawn.get(key) ?? []), i + 1]);
  });

  const out = new Map<number, Marker[]>();
  for (const tile of encounter.tiles) {
    const starts = tile.nodes.filter((node) => node.kind === 'start').length;
    let startIndex = 0;
    const list = tile.nodes.flatMap((node): Marker[] => {
      const { x, y } = nodeCentre(node.r, node.c);
      let label = '';
      if (node.kind === 'spawn') {
        // A spawn node nobody starts on stays as printed: a red marker would read as an enemy.
        label = (onSpawn.get(`${String(tile.tile)}:${node.ref}`) ?? []).join(',');
        if (!label) return [];
      } else if (node.kind === 'terrain') {
        label = terrainName(node.ref).charAt(0);
      } else if (node.kind === 'start' && encounter.partySize > starts) {
        const here = sharedStarts(encounter.partySize, starts, startIndex);
        startIndex += 1;
        label = here > 1 ? String(here) : '';
      }
      return [{ kind: node.kind, x, y, label }];
    });
    out.set(tile.tile, list);
  }
  return out;
}

/** Characters on start node `index` when `party` share `nodes` start nodes, earlier nodes first. */
export function sharedStarts(party: number, nodes: number, index: number): number {
  if (nodes <= 0) return 0;
  return Math.floor(party / nodes) + (index < party % nodes ? 1 : 0);
}
