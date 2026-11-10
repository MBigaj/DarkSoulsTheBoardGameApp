/** Event filters (handoff filter table, Event row). */
import type { Event } from '@/shared/api/types';
import { list, type Values } from '@/shared/lib/url-state';
import { anyOf, every } from './match';

export const eventFields = {
  eventType: list('kind', every<Event['eventType']>()(['immediate', 'consumable', 'rendezvous'])),
};

export type EventFilters = Values<typeof eventFields>;

export function matchesEvent(card: Event, f: EventFilters): boolean {
  return anyOf(f.eventType, card.eventType);
}
