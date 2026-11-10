import type { CardType } from '@/shared/lib/card-types';

/**
 * Archive tabs (ArchiveFinal): URL slug (`/cards/:type`), the card type it shows, its label,
 * the plural used in copy and the overview blurb.
 */
export const ARCHIVE_TABS = [
  {
    slug: 'treasure',
    type: 'treasure',
    label: 'Treasure',
    lower: 'treasure cards',
    blurb: 'Weapons, armour, spells, upgrades and items, from starter kits to boss drops.',
  },
  {
    slug: 'enemies',
    type: 'enemy',
    label: 'Enemies',
    lower: 'enemies',
    blurb: 'Enemy data cards: threat, health, defences and behaviour.',
  },
  {
    slug: 'bosses',
    type: 'boss',
    label: 'Bosses',
    lower: 'bosses',
    blurb: 'Mini and main boss data cards.',
  },
  {
    slug: 'behaviour',
    type: 'behaviour',
    label: 'Behaviour decks',
    lower: 'behaviour cards',
    blurb: 'Each boss has its own behaviour deck with heat-up cards.',
  },
  {
    slug: 'encounters',
    type: 'encounter',
    label: 'Encounters',
    lower: 'encounters',
    blurb: 'Objective, rewards, special rules and tile layout.',
  },
  {
    slug: 'events',
    type: 'event',
    label: 'Events',
    lower: 'events',
    blurb: 'Drawn at the bonfire: Immediate, Consumable and Rendezvous.',
  },
] as const satisfies readonly {
  slug: string;
  type: CardType;
  label: string;
  lower: string;
  blurb: string;
}[];

export type ArchiveTab = (typeof ARCHIVE_TABS)[number];

export function tabForSlug(slug: string | undefined): ArchiveTab | undefined {
  return ARCHIVE_TABS.find((tab) => tab.slug === slug);
}
