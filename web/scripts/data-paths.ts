import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/** The committed fixture set: enough cards for every test, so CI never needs the real store. */
export const TEST_FIXTURES_DIR = here('../test/fixtures');

/**
 * Card data store (DSTBG_DATA layout: sets/, schema/, dice.json).
 * DATA_DIR wins; otherwise the sibling checkout next to the repo; otherwise the test fixtures,
 * so a build without the store (CI, the production image) still works, with fixture data.
 */
export function resolveDataDir(): string {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  const sibling = here('../../../DSTBG_DATA');
  return existsSync(sibling) ? sibling : TEST_FIXTURES_DIR;
}

/**
 * Phase 1 fixtures that aren't in the store yet (classes, forged encounters), shared with the
 * backend seed. FIXTURES_DIR wins; otherwise the repo's data/fixtures; otherwise the test fixtures.
 */
export function resolveFixturesDir(): string {
  if (process.env.FIXTURES_DIR) return process.env.FIXTURES_DIR;
  const repo = here('../../data/fixtures');
  return existsSync(repo) ? repo : TEST_FIXTURES_DIR;
}
