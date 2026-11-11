/**
 * The filter rail per card type (ArchiveFinal): groups, their filters and option labels, plus
 * the active-filter chips. The fields and matching live in `filters/`; this is presentation.
 */
import { SET_CODES, type CardType, type SetCode } from '@/shared/lib/card-types';
import type { Bounds } from '@/shared/lib/url-state';
import type { CommonFilters, TypeFilters } from './filters';

type Value = string | number;
type Key<T extends CardType> = keyof TypeFilters<T> & string;

export type RailFilter<T extends CardType = CardType> =
  /** Any of the options. */
  | { kind: 'pills'; key: Key<T>; label: string; options: readonly (readonly [Value, string])[] }
  /** Pills whose options come from the data (class slugs from `classes/*.json`). */
  | { kind: 'classes'; key: Key<T>; label: string }
  /** Every ticked option. */
  | { kind: 'checks'; key: Key<T>; label: string; options: readonly (readonly [Value, string])[] }
  /** Card uses every ticked die. */
  | { kind: 'dice'; key: Key<T>; label: string }
  /** Upper-bound sliders, "Any" at the top. */
  | {
      kind: 'max';
      label: string;
      max: number;
      sliders: readonly { key: Key<T>; label: string }[];
    }
  /** Lower-bound slider, "Any" at the bottom. */
  | { kind: 'min'; key: Key<T>; label: string; slider: string; min: number; max: number }
  /** Min–max pair. */
  | { kind: 'range'; key: Key<T>; label: string; min: number; max: number };

export type RailGroup<T extends CardType = CardType> = {
  title: string;
  /** Open on first view (handoff: Treasure Card and Requirements). */
  open: boolean;
  filters: readonly RailFilter<T>[];
};

const treasure: readonly RailGroup<'treasure'>[] = [
  {
    title: 'Card',
    open: true,
    filters: [
      {
        kind: 'pills',
        key: 'deck',
        label: 'Deck',
        options: [
          ['starter', 'Starter'],
          ['treasure', 'Treasure'],
          ['boss', 'Boss drop'],
        ],
      },
      {
        kind: 'pills',
        key: 'rarity',
        label: 'Rarity',
        options: [
          ['common', 'Common'],
          ['rare', 'Rare'],
          ['legendary', 'Legendary'],
        ],
      },
      { kind: 'classes', key: 'class', label: 'Class' },
      {
        kind: 'pills',
        key: 'equip',
        label: 'Slot',
        options: [
          ['hand', 'Hand'],
          ['armour', 'Armour'],
          ['upgrade', 'Upgrade'],
          ['consumable', 'Consumable'],
        ],
      },
      {
        kind: 'pills',
        key: 'hands',
        label: 'Hands',
        options: [
          [1, 'One-handed'],
          [2, 'Two-handed'],
        ],
      },
    ],
  },
  {
    title: 'Requirements',
    open: true,
    filters: [
      {
        kind: 'max',
        label: 'Max stat requirement',
        max: 40,
        sliders: [
          { key: 'strength', label: 'STR' },
          { key: 'dexterity', label: 'DEX' },
          { key: 'intelligence', label: 'INT' },
          { key: 'faith', label: 'FAI' },
        ],
      },
    ],
  },
  {
    title: 'Attack',
    open: false,
    filters: [
      { kind: 'dice', key: 'dice', label: 'Attack dice' },
      {
        kind: 'pills',
        key: 'damageType',
        label: 'Damage type',
        options: [
          ['physical', 'Physical'],
          ['magical', 'Magical'],
        ],
      },
      {
        kind: 'pills',
        key: 'conditions',
        label: 'Status effects',
        options: [
          ['bleed', 'Bleed'],
          ['poison', 'Poison'],
          ['stagger', 'Stagger'],
        ],
      },
      {
        kind: 'checks',
        key: 'features',
        label: 'Attack features',
        options: [
          ['nodeAttack', 'Node attack'],
          ['push', 'Push'],
          ['shaft', 'Shaft'],
          ['repeat', 'Repeat'],
          ['move', 'Move'],
        ],
      },
      { kind: 'min', key: 'range', label: 'Range', slider: 'Min range', min: 0, max: 3 },
    ],
  },
  {
    title: 'Defence',
    open: false,
    filters: [
      {
        kind: 'checks',
        key: 'defence',
        label: 'Defence dice',
        options: [
          ['block', 'Has block dice'],
          ['resist', 'Has resist dice'],
        ],
      },
      { kind: 'min', key: 'dodge', label: 'Dodge', slider: 'Min dodge', min: 0, max: 2 },
      {
        kind: 'min',
        key: 'upgradeSlots',
        label: 'Upgrade slots',
        slider: 'Min slots',
        min: 0,
        max: 2,
      },
    ],
  },
];

const RAIL: { [T in CardType]: readonly RailGroup<T>[] } = {
  treasure,
  enemy: [
    {
      title: 'Stats',
      open: true,
      filters: [
        { kind: 'range', key: 'threat', label: 'Threat level', min: 0, max: 10 },
        { kind: 'range', key: 'health', label: 'Health', min: 1, max: 10 },
      ],
    },
  ],
  boss: [
    {
      title: 'Boss',
      open: true,
      filters: [
        {
          kind: 'pills',
          key: 'tier',
          label: 'Type',
          options: [
            ['mini', 'Mini boss'],
            ['main', 'Main boss'],
          ],
        },
        { kind: 'range', key: 'threat', label: 'Threat level', min: 0, max: 10 },
        { kind: 'range', key: 'health', label: 'Health', min: 20, max: 40 },
      ],
    },
  ],
  behaviour: [],
  encounter: [
    {
      title: 'Encounter',
      open: true,
      filters: [
        {
          kind: 'pills',
          key: 'level',
          label: 'Level',
          options: [
            [1, 'I'],
            [2, 'II'],
            [3, 'III'],
            ['boss', 'Boss'],
          ],
        },
        {
          kind: 'pills',
          key: 'tiles',
          label: 'Number of tiles',
          options: [
            [1, '1'],
            [2, '2'],
            [3, '3'],
            [4, '4'],
          ],
        },
        {
          kind: 'checks',
          key: 'includes',
          label: 'Includes',
          options: [
            ['traps', 'Traps'],
            ['chests', 'Treasure chests'],
            ['trial', 'Trial'],
          ],
        },
        {
          kind: 'pills',
          key: 'keywords',
          label: 'Special rule',
          options: [
            ['barrage', 'Barrage'],
            ['bitterCold', 'Bitter cold'],
            ['darkness', 'Darkness'],
            ['eerie', 'Eerie'],
            ['gang', 'Gang'],
            ['hidden', 'Hidden'],
            ['illusion', 'Illusion'],
            ['mimic', 'Mimic'],
            ['onslaught', 'Onslaught'],
            ['poisonMist', 'Poison mist'],
            ['snowstorm', 'Snowstorm'],
            ['timer', 'Timer'],
          ],
        },
      ],
    },
  ],
  event: [
    {
      title: 'Event',
      open: true,
      filters: [
        {
          kind: 'pills',
          key: 'eventType',
          label: 'Type',
          options: [
            ['immediate', 'Immediate'],
            ['consumable', 'Consumable'],
            ['rendezvous', 'Rendezvous'],
          ],
        },
      ],
    },
  ],
};

export function railFor<T extends CardType>(type: T): readonly RailGroup<T>[] {
  return RAIL[type];
}

export const SET_NAMES: Record<SetCode, { name: string; short: string }> = {
  tog: { name: 'Tomb of Giants', short: 'ToG' },
  sc: { name: 'Sunless City', short: 'SC' },
  pwa: { name: 'Painted World of Ariamis', short: 'PWA' },
};

/** Rail order (canvas): ToG, SC, PWA. */
export const RAIL_SETS: readonly SetCode[] = ['tog', 'sc', 'pwa'];

/** Sets shown: `sets` empty in the URL means every set. */
export function shownSets(sets: readonly SetCode[]): readonly SetCode[] {
  return sets.length === 0 ? SET_CODES : sets;
}

/** Ticking or unticking one set; all three ticked is written as "no set filter". */
export function toggleSet(sets: readonly SetCode[], set: SetCode): SetCode[] {
  const shown = shownSets(sets);
  const next = shown.includes(set) ? shown.filter((s) => s !== set) : [...shown, set];
  return next.length === SET_CODES.length ? [] : SET_CODES.filter((s) => next.includes(s));
}

type Values = Record<string, unknown>;

/** Selected options in one filter (the group badge counts every one). */
export function selectedCount(filter: RailFilter, values: Values): number {
  switch (filter.kind) {
    case 'pills':
    case 'classes':
    case 'checks':
    case 'dice':
      return (values[filter.key] as readonly unknown[]).length;
    case 'max':
      return filter.sliders.filter((s) => values[s.key] !== undefined).length;
    case 'min':
      return values[filter.key] === undefined ? 0 : 1;
    case 'range': {
      const bounds = values[filter.key] as Bounds;
      return bounds.min === undefined && bounds.max === undefined ? 0 : 1;
    }
  }
}

export type ActiveChip = {
  id: string;
  label: string;
  /** What removing the chip writes: common params and/or the type's own filters. */
  clear: { common?: Partial<CommonFilters>; filters?: Values };
};

const DIE_LABEL = { black: 'Black', blue: 'Blue', orange: 'Orange' } as const;

/** The active-filter chips (canvas labels): hidden sets, the search, then the type's filters. */
export function activeChips(
  common: CommonFilters,
  type: CardType | undefined,
  filters: Values,
  className: (slug: string) => string,
): ActiveChip[] {
  const chips: ActiveChip[] = [];
  const shown = shownSets(common.sets);
  for (const set of RAIL_SETS) {
    if (shown.includes(set)) continue;
    chips.push({
      id: `set-${set}`,
      label: `Hide ${SET_NAMES[set].short}`,
      clear: { common: { sets: toggleSet(common.sets, set) } },
    });
  }
  const q = common.q.trim();
  if (q !== '') chips.push({ id: 'q', label: `“${q}”`, clear: { common: { q: '' } } });
  if (type === undefined) return chips;

  const optionLabel = (filter: { options: readonly (readonly [Value, string])[] }, v: Value) =>
    filter.options.find(([value]) => value === v)?.[1] ?? String(v);

  for (const group of railFor(type)) {
    for (const filter of group.filters) {
      if (selectedCount(filter, filters) === 0) continue;
      switch (filter.kind) {
        case 'pills':
        case 'classes': {
          const picked = filters[filter.key] as readonly Value[];
          const labels = picked.map((v) =>
            filter.kind === 'pills' ? optionLabel(filter, v) : className(String(v)),
          );
          chips.push({
            id: filter.key,
            label: `${filter.label}: ${labels.join(', ')}`,
            clear: { filters: { [filter.key]: [] } },
          });
          break;
        }
        case 'checks': {
          const picked = filters[filter.key] as readonly Value[];
          chips.push({
            id: filter.key,
            label: picked.map((v) => optionLabel(filter, v)).join(', '),
            clear: { filters: { [filter.key]: [] } },
          });
          break;
        }
        case 'dice': {
          const picked = filters[filter.key] as readonly (keyof typeof DIE_LABEL)[];
          chips.push({
            id: filter.key,
            label: `${picked.map((d) => DIE_LABEL[d]).join(' + ')} dice`,
            clear: { filters: { [filter.key]: [] } },
          });
          break;
        }
        case 'max': {
          const active = filter.sliders.filter((s) => filters[s.key] !== undefined);
          chips.push({
            id: active.map((s) => s.key).join('-'),
            label: active.map((s) => `${s.label} ≤ ${String(filters[s.key])}`).join(', '),
            clear: { filters: Object.fromEntries(active.map((s) => [s.key, undefined])) },
          });
          break;
        }
        case 'min':
          chips.push({
            id: filter.key,
            label: `${filter.label} ≥ ${String(filters[filter.key])}`,
            clear: { filters: { [filter.key]: undefined } },
          });
          break;
        case 'range': {
          const { min = filter.min, max = filter.max } = filters[filter.key] as Bounds;
          chips.push({
            id: filter.key,
            label: `${filter.label} ${String(min)}–${String(max)}`,
            clear: { filters: { [filter.key]: {} } },
          });
          break;
        }
      }
    }
  }
  return chips;
}
