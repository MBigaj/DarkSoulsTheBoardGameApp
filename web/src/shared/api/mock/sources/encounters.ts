import type { ForgedEncounter } from '../../types';

// Phase 1 fixtures: one sample per level, until the backend generator exists.
const files = import.meta.glob<ForgedEncounter>('@fixtures/encounters/*.json', {
  eager: true,
  import: 'default',
});
export default Object.values(files);
