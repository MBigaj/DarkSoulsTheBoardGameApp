import type { ForgedEncounter, ForgeRequest } from '../types';

/**
 * Mock mode's stand-in for the generator: the fixture closest to the request. Level counts most
 * (nearest level if none matches), then shared sets, then, in Custom mode, tile count, objective
 * and Trial. Ties go to the first fixture. Null only when there are no fixtures.
 */
export function matchFixture(
  fixtures: readonly ForgedEncounter[],
  request: ForgeRequest,
): ForgedEncounter | null {
  let best: { fixture: ForgedEncounter; score: number } | null = null;
  for (const fixture of fixtures) {
    let score = 100 - 10 * Math.abs(fixture.level - request.level);
    score += 4 * fixture.sets.filter((set) => request.sets.includes(set)).length;
    if (request.mode === 'custom') {
      if (fixture.tiles.length === request.tiles) score += 3;
      if (fixture.objective === request.objective) score += 2;
      if ((fixture.trial !== undefined) === request.trial) score += 1;
    }
    if (!best || score > best.score) best = { fixture, score };
  }
  return best?.fixture ?? null;
}
