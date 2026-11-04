import type { RawBehaviour } from '../../generated';

// One chunk per card type: eager inside this module, which mockApi loads on first use.
const files = import.meta.glob<RawBehaviour>('@data/sets/*/behaviour/*.json', {
  eager: true,
  import: 'default',
});
export default Object.values(files);
