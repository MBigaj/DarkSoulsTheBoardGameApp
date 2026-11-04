import type { DiceTable } from '../../types';

const files = import.meta.glob<DiceTable>('@data/dice.json', { eager: true, import: 'default' });
export default Object.values(files)[0] ?? null;
