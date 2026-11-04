import type { ClassDef } from '../../types';

// Phase 1 fixture until the data store has classes.
const files = import.meta.glob<ClassDef[]>('@fixtures/classes.json', {
  eager: true,
  import: 'default',
});
export default Object.values(files)[0] ?? [];
