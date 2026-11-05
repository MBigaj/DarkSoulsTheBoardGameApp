import type { CardType } from '@/shared/lib/card-types';

/** Archive tabs: URL slug (`/cards/:type`), the card type it shows, and its label (ArchiveFinal). */
export const ARCHIVE_TABS = [
  { slug: 'treasure', type: 'treasure', label: 'Treasure' },
  { slug: 'enemies', type: 'enemy', label: 'Enemies' },
  { slug: 'bosses', type: 'boss', label: 'Bosses' },
  { slug: 'behaviour', type: 'behaviour', label: 'Behaviour decks' },
  { slug: 'encounters', type: 'encounter', label: 'Encounters' },
  { slug: 'events', type: 'event', label: 'Events' },
] as const satisfies readonly { slug: string; type: CardType; label: string }[];

export type ArchiveTab = (typeof ARCHIVE_TABS)[number];

export function tabForSlug(slug: string | undefined): ArchiveTab | undefined {
  return ARCHIVE_TABS.find((tab) => tab.slug === slug);
}
