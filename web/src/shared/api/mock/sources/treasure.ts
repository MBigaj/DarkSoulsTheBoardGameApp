import type { RawTreasure } from '../../generated';

// One chunk per card type: eager inside this module, which mockApi loads on first use.
const files = import.meta.glob<RawTreasure>('@data/sets/*/treasure/*.json', {
  eager: true,
  import: 'default',
});
export default Object.values(files);
