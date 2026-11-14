import type { ClassDef } from '@/shared/api/types';
import { SET_CODES, SET_NAMES } from '@/shared/lib/card-types';
import type { Stat } from './builder/builderReducer';

/** Stat codes and names, in dashboard order. */
export const STAT_LABELS: Record<Stat, { code: string; name: string }> = {
  strength: { code: 'STR', name: 'Strength' },
  dexterity: { code: 'DEX', name: 'Dexterity' },
  intelligence: { code: 'INT', name: 'Intelligence' },
  faith: { code: 'FAI', name: 'Faith' },
};

/** The boxes a class ships in, in set order: "SC · ToG" or "Sunless City · Tomb of Giants". */
export function classSets(cls: ClassDef, form: 'short' | 'name'): string {
  return SET_CODES.filter((set) => cls.sets.includes(set))
    .map((set) => SET_NAMES[set][form])
    .join(' · ');
}
