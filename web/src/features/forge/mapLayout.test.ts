import { describe, expect, it } from 'vitest';
import type { ForgedEncounter } from '@/shared/api/types';
import level1 from '../../../test/fixtures/encounters/level-1.json';
import level2 from '../../../test/fixtures/encounters/level-2.json';
import level3 from '../../../test/fixtures/encounters/level-3.json';
import { connectors, mapGrid, markers, sharedStarts, tileArt, tileLabel } from './mapLayout';

const pair = level1 as unknown as ForgedEncounter;
const lTurn = level2 as unknown as ForgedEncounter;
const switchback = level3 as unknown as ForgedEncounter;
const fixtures = [pair, lTurn, switchback];

describe('mapGrid: tile at → grid tracks', () => {
  it('columns: tile, gap, tile…; rows: header, art, gap, header…', () => {
    // level-3: (0,0) (0,1) (1,1) (1,2)
    const grid = mapGrid(switchback.tiles);
    expect(grid).toMatchObject({ columns: 3, rows: 2 });
    expect([...grid.cells]).toEqual([
      [1, { column: 1, row: 1 }],
      [2, { column: 3, row: 1 }],
      [3, { column: 3, row: 4 }],
      [4, { column: 5, row: 4 }],
    ]);
  });
});

describe('connectors: doors → bars in the gap between the two tiles', () => {
  it('side by side → across, in the column gap and the art row; stacked → down, in the gap row', () => {
    // level-2: 1 (0,0) → 2 (0,1) → 3 (1,1). Row 1 = headers, 2 = art, 3 = gap.
    expect(connectors(lTurn)).toEqual([
      { column: 2, row: 2, axis: 'across' },
      { column: 3, row: 3, axis: 'down' },
    ]);
  });

  it('works whichever way the door is written', () => {
    const reversed = { ...pair, doors: pair.doors.map(({ from, to }) => ({ from: to, to: from })) };
    expect(connectors(reversed)).toEqual(connectors(pair));
  });

  it('draws nothing for tiles that do not touch or do not exist', () => {
    const apart = {
      tiles: switchback.tiles,
      doors: [
        { from: { tile: 1, r: 2, c: 4 }, to: { tile: 4, r: 2, c: 0 } },
        { from: { tile: 1, r: 2, c: 4 }, to: { tile: 9, r: 2, c: 0 } },
      ],
    };
    expect(connectors(apart)).toEqual([]);
  });

  it('one bar per door in every fixture', () => {
    for (const e of fixtures) expect(connectors(e)).toHaveLength(e.doors.length);
  });
});

describe('markers', () => {
  it('numbers enemies in roster order; a spawn node lists everyone on it', () => {
    // level-2 enemies: 1 on T1 primary, 2 on T2 primary, 3 and 4 on T2 secondary.
    const tile2 = markers(lTurn).get(2) ?? [];
    expect(tile2.filter((m) => m.kind === 'spawn').map((m) => m.label)).toEqual(['2', '3,4']);
  });

  it('an empty spawn node is not drawn', () => {
    // level-1 tile 1: both spawn nodes printed, enemies only on the primary.
    const spawns = (markers(pair).get(1) ?? []).filter((m) => m.kind === 'spawn');
    expect(spawns.map((m) => m.label)).toEqual(['1']);
  });

  it('terrain shows its initial, at the node centre', () => {
    const tile1 = markers(lTurn).get(1) ?? [];
    // gravestone at (1, 3): centre ((3 + 1) / 6, (1 + 1) / 6)
    expect(tile1.find((m) => m.kind === 'terrain')).toEqual({
      kind: 'terrain',
      x: 4 / 6,
      y: 2 / 6,
      label: 'G',
    });
  });

  it('start nodes show a count only when characters share them', () => {
    const starts = (e: ForgedEncounter) =>
      (markers(e).get(1) ?? []).filter((m) => m.kind === 'start').map((m) => m.label);
    expect(starts(lTurn)).toEqual(['', '', '']); // 3 players, 3 nodes
    expect(starts(switchback)).toEqual(['2', '2']); // 4 players, 2 nodes
  });

  it('sharedStarts spreads the party, earlier nodes first', () => {
    expect([0, 1, 2].map((i) => sharedStarts(4, 3, i))).toEqual([2, 1, 1]);
    expect([0, 1].map((i) => sharedStarts(3, 2, i))).toEqual([2, 1]);
    expect(sharedStarts(2, 0, 0)).toBe(0);
  });
});

describe('tile ids', () => {
  it('→ printed label and art key', () => {
    expect(tileLabel('tog-tile-1b')).toBe('ToG 1B');
    expect(tileArt('pwa-tile-4b')).toBe('tiles/pwa/4b.png');
  });

  it('unknown ids stay as they are and have no art', () => {
    expect(tileLabel('boss-arena')).toBe('boss-arena');
    expect(tileArt('boss-arena')).toBeNull();
  });
});
