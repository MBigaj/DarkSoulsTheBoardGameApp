/** Boss filters (handoff filter table, Boss rows). */
import type { Boss } from '@/shared/api/types';
import { list, range, type Values } from '@/shared/lib/url-state';
import { anyOf, every, within } from './match';

export const bossFields = {
  tier: list('tier', every<Boss['tier']>()(['mini', 'main'])),
  threat: range('threat', 0, 10),
  health: range('health', 20, 40),
};

export type BossFilters = Values<typeof bossFields>;

export function matchesBoss(card: Boss, f: BossFilters): boolean {
  return anyOf(f.tier, card.tier) && within(f.threat, card.threat) && within(f.health, card.health);
}
