/** Static Home content, from the HomeFinal artboard and the card data store. */
// Owner-supplied art from the mockup; Vite hashes these, so they cache for a year.
import bossPriscilla from './art/boss-crossbreed-priscilla.webp';
import bossSmough from './art/boss-executioner-smough.webp';
import bossNito from './art/boss-gravelord-nito.webp';
import cardBlackKnightSword from './art/card-black-knight-sword.webp';
import cardDragonslayerSpear from './art/card-dragonslayer-spear.webp';
import tilePwa from './art/tile-pwa.webp';
import tileSc from './art/tile-sc.webp';
import tileTog from './art/tile-tog.webp';

export { default as heroTile } from './art/hero-tile.webp';

export type Tool = {
  to: string;
  title: string;
  line: string;
  cta: string;
  icon: 'archive' | 'builder' | 'forge';
};

export const TOOLS: readonly Tool[] = [
  {
    to: '/cards',
    title: 'Card Archive',
    line: 'Every card in the three sets, filtered by set, type, stat requirement and dice.',
    cta: 'Browse the archive',
    icon: 'archive',
  },
  {
    to: '/characters',
    title: 'Character Builder',
    line: 'Build a party of four, buy stat tiers, equip cards and check expected damage.',
    cta: 'Build a party',
    icon: 'builder',
  },
  {
    to: '/forge',
    title: 'Encounter Forge',
    line: 'New encounters from every enemy, tile and terrain token in your pool, shared by link.',
    cta: 'Forge an encounter',
    icon: 'forge',
  },
];

export const LATER = ['Campaign Weaver', 'Game snapshots', 'Figurine viewer'] as const;

export type CoreSet = {
  short: string;
  name: string;
  line: string;
  /** Background of the set's art slot (one of its tiles). */
  tile: string;
  /** The set's main boss card, shown in front of the tile. */
  boss: string;
  bossName: string;
  /**
   * Counts from the card data store (443 cards, checked 10 Nov). Cards printed in several sets
   * (the `shared` folder) count in every set they appear in.
   */
  counts: readonly [label: string, value: string][];
};

export const SETS: readonly CoreSet[] = [
  {
    short: 'SC',
    name: 'Sunless City',
    line: 'Herald, Pyromancer, Warrior · Titanite Demon, Ornstein & Smough',
    tile: tileSc,
    boss: bossSmough,
    bossName: 'Executioner Smough',
    counts: [
      ['Encounter cards', '29'],
      ['Event cards', '25'],
      ['Treasure cards', '92'],
      ['Enemies + bosses', '6 + 3'],
    ],
  },
  {
    short: 'ToG',
    name: 'Tomb of Giants',
    line: 'Cleric, Pyromancer, Thief · Black Knight, Gravelord Nito',
    tile: tileTog,
    boss: bossNito,
    bossName: 'Gravelord Nito',
    counts: [
      ['Encounter cards', '29'],
      ['Event cards', '23'],
      ['Treasure cards', '93'],
      ['Enemies + bosses', '6 + 2'],
    ],
  },
  {
    short: 'PWA',
    name: 'Painted World of Ariamis',
    line: 'Deprived, Mercenary, Sorcerer · Heavy Knight, Crossbreed Priscilla',
    tile: tilePwa,
    boss: bossPriscilla,
    bossName: 'Crossbreed Priscilla',
    counts: [
      ['Encounter cards', '29'],
      ['Event cards', '24'],
      ['Treasure cards', '91'],
      ['Enemies + bosses', '6 + 2'],
    ],
  },
];

/**
 * Hero fan, left to right (HomeFinal). `shape` is the card's printed shape: treasure 571 × 850,
 * boss data cards 611 × 850.
 */
export const HERO_FAN = [
  { src: cardDragonslayerSpear, shape: 'treasure' },
  { src: bossNito, shape: 'boss' },
  { src: bossSmough, shape: 'boss' },
  { src: bossPriscilla, shape: 'boss' },
  { src: cardBlackKnightSword, shape: 'treasure' },
] as const;
