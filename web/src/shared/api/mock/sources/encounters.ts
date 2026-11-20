import type { ForgedEncounter } from '../../types';

// Phase 1 fixtures (data/fixtures/encounters): one sample per level, until the backend generator
// exists. Untyped JSON: forge.test.ts checks each against the contract with encounterProblems.
const files = import.meta.glob<ForgedEncounter>('@fixtures/encounters/*.json', {
  eager: true,
  import: 'default',
});
export default Object.values(files);
