import type { ClassDef } from '../../types';

/** Class dashboards from the store (`classes/*.json`), in name order. */
const files = import.meta.glob<ClassDef>('@data/classes/*.json', {
  eager: true,
  import: 'default',
});
export default Object.values(files).sort((a, b) => a.name.localeCompare(b.name));
