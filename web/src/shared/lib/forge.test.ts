import { describe, expect, it } from 'vitest';
import type { ForgedEncounter } from '@/shared/api/types';
import { doorwaySide, encounterProblems, turnNode } from './forge';

// The committed fixtures: the app's (data/fixtures) and the tests' copies (test/fixtures).
const appFixtures = import.meta.glob<ForgedEncounter>('/../data/fixtures/encounters/*.json', {
  eager: true,
  import: 'default',
});
const testFixtures = import.meta.glob<ForgedEncounter>('/test/fixtures/encounters/*.json', {
  eager: true,
  import: 'default',
});
type TileFile = {
  _id: string;
  nodes: Record<string, [number, number]>;
  doorways: [number, number][];
};
const tiles = Object.values(
  import.meta.glob<TileFile>('/test/fixtures/tiles/*/*.json', { eager: true, import: 'default' }),
);
const fixtures = Object.values(appFixtures);
const level = (n: number) => fixtures.find((f) => f.level === n) as ForgedEncounter;

describe('turnNode', () => {
  it('turns clockwise a quarter at a time; four turns come back', () => {
    expect(turnNode([0, 2], 1)).toEqual([2, 4]); // top doorway → right
    expect(turnNode([2, 4], 1)).toEqual([4, 2]); // right → bottom
    expect(turnNode([0, 0], 1)).toEqual([0, 4]); // a corner
    expect(turnNode([1, 3], 2)).toEqual([3, 1]);
    expect(turnNode([3, 1], 4)).toEqual([3, 1]);
  });

  it('keeps nodes on the lattice (r + c even)', () => {
    for (const turns of [1, 2, 3]) {
      for (const [r, c] of [
        [0, 0],
        [1, 1],
        [2, 4],
        [3, 3],
        [4, 2],
      ] as const) {
        const [tr, tc] = turnNode([r, c], turns);
        expect((tr + tc) % 2).toBe(0);
      }
    }
  });

  it('a doorway faces its side of the tile', () => {
    expect(doorwaySide([0, 2])).toEqual([-1, 0]);
    expect(doorwaySide([2, 0])).toEqual([0, -1]);
    expect(doorwaySide([2, 2])).toBeNull();
  });
});

describe('Forge fixtures', () => {
  it('one per level, each fitting the contract', () => {
    expect(fixtures.map((f) => f.level).sort()).toEqual([1, 2, 3]);
    for (const fixture of fixtures) expect(encounterProblems(fixture), fixture.id).toEqual([]);
  });

  it('between them cover every node kind, doors, a Trial and special rules', () => {
    const kinds = new Set(
      fixtures.flatMap((f) => f.tiles.flatMap((t) => t.nodes.map((n) => n.kind))),
    );
    expect([...kinds].sort()).toEqual(['doorway', 'exit', 'spawn', 'start', 'terrain']);
    expect(fixtures.some((f) => f.doors.length > 0)).toBe(true);
    expect(fixtures.some((f) => f.trial)).toBe(true);
    expect(fixtures.some((f) => f.specialRules.some((rule) => rule.text))).toBe(true);
    expect(fixtures.every((f) => f.specialRules.length > 0)).toBe(true);
  });

  it('spawn, terrain and doorway nodes are the tile’s printed ones, turned', () => {
    for (const fixture of fixtures) {
      for (const placed of fixture.tiles) {
        const tile = tiles.find((t) => t._id === placed.tileId);
        expect(tile, placed.tileId).toBeDefined();
        if (!tile) continue;
        const turned = (rc: [number, number] | undefined) =>
          rc ? turnNode(rc, placed.turns).join(',') : '';
        const doorways = tile.doorways.map(turned);
        for (const node of placed.nodes) {
          const at = `${String(node.r)},${String(node.c)}`;
          if (node.kind === 'spawn') expect(at).toBe(turned(tile.nodes[`${node.ref}Spawn`]));
          if (node.kind === 'terrain') {
            expect([
              turned(tile.nodes.primaryTerrain),
              turned(tile.nodes.secondaryTerrain),
            ]).toContain(at);
          }
          if (node.kind === 'doorway' || node.kind === 'exit') expect(doorways).toContain(at);
        }
      }
    }
  });

  it('the tests use the same encounters as the app', () => {
    const byName = (files: Record<string, ForgedEncounter>): Record<string, ForgedEncounter> =>
      Object.fromEntries(
        Object.entries(files).map(([path, f]): [string, ForgedEncounter] => [
          path.split('/').pop() ?? path,
          f,
        ]),
      );
    expect(byName(testFixtures)).toEqual(byName(appFixtures));
  });
});

describe('encounterProblems', () => {
  it('names what breaks the contract', () => {
    const good = level(2);
    const [first, second, third] = good.tiles;
    if (!first || !second || !third) throw new Error('level 2 has three tiles');
    const broken: ForgedEncounter = {
      ...good,
      tiles: [
        { ...first, nodes: [...first.nodes, { r: 1, c: 2, kind: 'start' }] }, // off the lattice
        { ...second, at: [1, 0] }, // no longer next to tile 1's doorway
        { ...third, nodes: third.nodes.filter((n) => n.kind !== 'exit') }, // exit gone
      ],
      enemies: [
        ...good.enemies,
        { enemyId: 'tog-enemy-skeleton-beast', tile: 1, spawn: 'primary' },
      ],
    };
    const problems = encounterProblems(broken).join('\n');
    expect(problems).toMatch(/tile 1 node \[1, 2\]: not on the lattice/);
    expect(problems).toMatch(/door 1→2: the doorways must face each other/);
    expect(problems).toMatch(/exactly one exit/);
    expect(problems).toMatch(/expected 7 enemies, found 8/);
    expect(problems).toMatch(/tile 1 must hold exactly one enemy/);
  });

  it('a tile cut off from the rest is not connected', () => {
    const good = level(2);
    const third = good.tiles[2];
    if (!third) throw new Error('level 2 has three tiles');
    // Tile 3 loses its doorway node and the door into it: no dangling doorway, but an island.
    const island: ForgedEncounter = {
      ...good,
      tiles: [
        ...good.tiles.slice(0, 2),
        { ...third, nodes: third.nodes.filter((n) => n.kind !== 'doorway') },
      ],
      doors: good.doors.filter((d) => d.to.tile !== 3),
    };
    // Tile 2's doorway towards tile 3 is dropped too, so only the connection checks can catch it.
    const [, second] = island.tiles;
    if (!second) throw new Error('level 2 has three tiles');
    island.tiles[1] = {
      ...second,
      nodes: second.nodes.filter((n) => !(n.kind === 'doorway' && n.r === 4 && n.c === 2)),
    };
    const problems = encounterProblems(island).join('\n');
    expect(problems).toMatch(/tile 3 is not connected to tile 1 by doors/);
    expect(problems).toMatch(/expected 2 doors for 3 tiles, found 1/);
    expect(problems).not.toMatch(/has no door/);
  });

  it('reports missing or malformed fields instead of throwing', () => {
    const good = level(1);
    const first = good.tiles[0];
    if (!first) throw new Error('level 1 has tiles');
    for (const [field, value, sentence] of [
      ['doors', undefined, /doors must be a list/],
      ['enemies', null, /enemies must be a list/],
      ['terrain', 'barrel', /terrain must be a list/],
      ['tiles', [{ ...first, nodes: undefined }], /tile 1: nodes must be a list/],
      ['tiles', [{ ...first, at: [0] }], /tile 1: at must be two integers/],
      ['tiles', [null], /tile 1: not an object/],
    ] as const) {
      let problems: string[] = [];
      expect(() => (problems = encounterProblems({ ...good, [field]: value }))).not.toThrow();
      expect(problems.join('\n'), field).toMatch(sentence);
    }
  });

  it('enemies come from the encounter’s sets', () => {
    const good = level(2); // ToG
    const [first, ...rest] = good.enemies;
    if (!first) throw new Error('level 2 has enemies');
    const problems = encounterProblems({
      ...good,
      enemies: [{ ...first, enemyId: 'sc-enemy-hollow-soldier' }, ...rest],
    });
    expect(problems).toEqual([
      "enemy sc-enemy-hollow-soldier: its set (sc) isn't one of the encounter's sets",
    ]);
  });

  it('terrain pieces and terrain nodes match one to one on each tile', () => {
    const good = level(2); // tile 3 holds a torch and a shrine
    const noPiece = encounterProblems({
      ...good,
      terrain: good.terrain.filter((t) => t.name !== 'shrine'),
    });
    expect(noPiece).toEqual(["tile 3: terrain nodes [torch, shrine] don't match terrain [torch]"]);
    const extraPiece = encounterProblems({
      ...good,
      terrain: [...good.terrain, { name: 'torch', tile: 3 }],
    });
    expect(extraPiece).toEqual([
      "tile 3: terrain nodes [torch, shrine] don't match terrain [torch, shrine, torch]",
    ]);
  });

  it('turns away anything that isn’t an encounter', () => {
    expect(encounterProblems(null)).toEqual(['not an object']);
    expect(encounterProblems({ id: 'x' })).toContain('tiles must hold 1–4 tiles');
  });
});
