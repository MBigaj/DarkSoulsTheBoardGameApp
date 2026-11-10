/**
 * Static Home content, from the HomeFinal artboard and the card data store.
 * Art comes from the store (paths inside its images/ folder); none is committed to the repo.
 */

/** Hero backdrop: Sunless City tile 3a. */
export const HERO_TILE = 'tiles/sc/3a.png';

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
  /** Store art: one of the set's tiles, behind… */
  tile: string;
  /** …its main boss card. */
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
    tile: 'tiles/sc/2a.png',
    boss: 'sc/boss/executioner-smough.png',
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
    tile: 'tiles/tog/3a.png',
    boss: 'tog/boss/gravelord-nito.png',
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
    tile: 'tiles/pwa/1a.png',
    boss: 'pwa/boss/crossbreed-priscilla.png',
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
  { art: 'sc/treasure/dragonslayer-spear.png', shape: 'treasure' },
  { art: 'tog/boss/gravelord-nito.png', shape: 'boss' },
  { art: 'sc/boss/executioner-smough.png', shape: 'boss' },
  { art: 'pwa/boss/crossbreed-priscilla.png', shape: 'boss' },
  { art: 'tog/treasure/black-knight-sword.png', shape: 'treasure' },
] as const;
