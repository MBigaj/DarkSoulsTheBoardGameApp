import type { CardBack } from '../../types';

/** Card backs from the store (`backs/{set}/*.json`), in `_id` order. */
const files = import.meta.glob<CardBack>('@data/backs/*/*.json', {
  eager: true,
  import: 'default',
});
export default Object.values(files).sort((a, b) => (a._id < b._id ? -1 : 1));
