/** Enemy filters (handoff filter table, Enemy row). */
import type { Enemy } from '@/shared/api/types';
import { range, type Values } from '@/shared/lib/url-state';
import { within } from './match';

export const enemyFields = {
  threat: range('threat', 0, 10),
  health: range('health', 1, 10),
};

export type EnemyFilters = Values<typeof enemyFields>;

export function matchesEnemy(card: Enemy, f: EnemyFilters): boolean {
  return within(f.threat, card.threat) && within(f.health, card.health);
}
