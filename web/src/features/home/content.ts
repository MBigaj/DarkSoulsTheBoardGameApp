/** Static Home content, from the HomeFinal artboard and the rulebooks (claude/game-data.md). */

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
  /** Card counts from the rulebook; "[N]" until Painted World content exists. */
  counts: readonly [label: string, value: string][];
};

export const SETS: readonly CoreSet[] = [
  {
    short: 'SC',
    name: 'Sunless City',
    line: 'Herald, Pyromancer, Warrior · Titanite Demon, Ornstein & Smough',
    counts: [
      ['Encounter cards', '29'],
      ['Event cards', '30'],
      ['Treasure cards', '85'],
    ],
  },
  {
    short: 'ToG',
    name: 'Tomb of Giants',
    line: 'Cleric, Pyromancer, Thief · Black Knight, Gravelord Nito',
    counts: [
      ['Encounter cards', '29'],
      ['Event cards', '30'],
      ['Treasure cards', '85'],
    ],
  },
  {
    short: 'PWA',
    name: 'Painted World of Ariamis',
    line: '[Classes and bosses to be added]',
    counts: [
      ['Encounter cards', '[N]'],
      ['Event cards', '[N]'],
      ['Treasure cards', '[N]'],
    ],
  },
];
