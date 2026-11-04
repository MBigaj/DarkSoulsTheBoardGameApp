import type { RawBoss } from '../../generated';

// One chunk per card type: eager inside this module, which mockApi loads on first use.
const files = import.meta.glob<RawBoss>('@data/sets/*/boss/*.json', {
  eager: true,
  import: 'default',
});
export default Object.values(files);
