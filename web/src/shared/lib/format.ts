/** Text shown under archive tiles: badge label, stat line and the short display code. */
import type {
  Behaviour,
  Boss,
  CardSet,
  Encounter,
  Enemy,
  Event,
  Treasure,
} from '@/shared/api/types';
import type { CardType } from './card-types';

const ROMAN = { 1: 'I', 2: 'II', 3: 'III' } as const;

const REQUIREMENTS = [
  ['strength', 'STR'],
  ['dexterity', 'DEX'],
  ['intelligence', 'INT'],
  ['faith', 'FAI'],
] as const;

const TYPE_LABEL: Record<CardType, string> = {
  treasure: 'Treasure',
  enemy: 'Enemy',
  boss: 'Boss',
  behaviour: 'Behaviour',
  encounter: 'Encounter',
  event: 'Event',
};

type Common = '_id' | 'set' | 'type' | 'name';

/** The fields tile text reads. Every normalized card fits. */
export type TileCard =
  | Pick<Treasure, Common | 'deck' | 'rarity' | 'requirements'>
  | Pick<Enemy, Common | 'threat' | 'health'>
  | Pick<Boss, Common | 'tier' | 'threat' | 'health'>
  | Pick<Behaviour, Common | 'boss' | 'heatUp' | 'parts'>
  | (Pick<Encounter, Common | 'level' | 'boss'> & { tiles: readonly unknown[] })
  | Pick<Event, Common | 'eventType'>;

/** Display name for a card `_id` (bosses on behaviour cards); unknown ids show nothing. */
export type NameOf = (id: string) => string | undefined;

const capitalize = (word: string) => (word[0]?.toUpperCase() ?? '') + word.slice(1);

/**
 * The mono line under a tile:
 *   treasure  "STR 25 · DEX 15" (zero requirements left out), or "No requirements"
 *   enemy     "Threat 5 · Health 1"
 *   boss      "Main · Threat 9 · Health 30"
 *   encounter "Level III · 3 tiles", or "Boss · 2 tiles"
 *   event     its type, e.g. "Rendezvous"
 *   behaviour its boss, e.g. "Black Knight · Heat up" (both bosses on a combined card)
 */
export function statLine(card: TileCard, nameOf: NameOf = () => undefined): string {
  switch (card.type) {
    case 'treasure': {
      const parts = REQUIREMENTS.filter(([key]) => card.requirements[key] > 0).map(
        ([key, code]) => `${code} ${String(card.requirements[key])}`,
      );
      return parts.length > 0 ? parts.join(' · ') : 'No requirements';
    }
    case 'enemy':
      return `Threat ${String(card.threat)} · Health ${String(card.health)}`;
    case 'boss':
      return `${capitalize(card.tier)} · Threat ${String(card.threat)} · Health ${String(card.health)}`;
    case 'encounter': {
      const count = card.tiles.length;
      const tiles = `${String(count)} ${count === 1 ? 'tile' : 'tiles'}`;
      return card.level === undefined ? `Boss · ${tiles}` : `Level ${ROMAN[card.level]} · ${tiles}`;
    }
    case 'event':
      return capitalize(card.eventType);
    case 'behaviour': {
      const bosses = card.parts.length > 0 ? card.parts.map((part) => part.boss) : [card.boss];
      const names = bosses.flatMap((id) => {
        const name = id === undefined ? undefined : nameOf(id);
        return name === undefined ? [] : [name];
      });
      return [names.join(' & '), isHeatUp(card) ? 'Heat up' : '']
        .filter((part) => part !== '')
        .join(' · ');
    }
  }
}

function isHeatUp(card: Pick<Behaviour, 'heatUp' | 'parts'>): boolean {
  return card.heatUp || card.parts.some((part) => part.heatUp);
}

/**
 * The tile's badge: rarity or "Boss drop" (treasure), "Mini boss" / "Main boss", "Heat up"
 * (behaviour), "Boss" (boss encounter), else the type.
 */
export function badgeLabel(card: TileCard): string {
  switch (card.type) {
    case 'treasure':
      if (card.deck === 'boss') return 'Boss drop';
      return card.rarity ? capitalize(card.rarity) : TYPE_LABEL.treasure;
    case 'boss':
      return card.tier === 'mini' ? 'Mini boss' : 'Main boss';
    case 'behaviour':
      return isHeatUp(card) ? 'Heat up' : TYPE_LABEL.behaviour;
    case 'encounter':
      return card.boss === undefined ? TYPE_LABEL.encounter : 'Boss';
    default:
      return TYPE_LABEL[card.type];
  }
}

/** "Card ID" order: plain `_id` order (set, type, slug), the same order the API sorts by. */
export function compareById(a: { _id: string }, b: { _id: string }): number {
  return a._id < b._id ? -1 : a._id > b._id ? 1 : 0;
}

const CODE_PREFIX: Record<CardSet, string> = { sc: 'SC', tog: 'TOG', pwa: 'PWA', shared: 'SH' };

/**
 * Short display codes, `SET-NNN` (`SH-` for shared cards), numbered from 001 in `_id` order within each set and type.
 * Derived for now, so codes shift when cards are added; printed card numbers replace them if
 * the data ever carries them (frontend plan, open question 3).
 */
export function displayCodes(
  cards: readonly { _id: string; set: CardSet; type: CardType }[],
): Map<string, string> {
  const groups = new Map<string, { prefix: string; ids: string[] }>();
  for (const card of cards) {
    const key = `${card.set}-${card.type}`;
    const group = groups.get(key) ?? { prefix: CODE_PREFIX[card.set], ids: [] };
    group.ids.push(card._id);
    groups.set(key, group);
  }
  const codes = new Map<string, string>();
  for (const { prefix, ids } of groups.values()) {
    [...new Set(ids)]
      .sort((a, b) => compareById({ _id: a }, { _id: b }))
      .forEach((id, i) => {
        codes.set(id, `${prefix}-${String(i + 1).padStart(3, '0')}`);
      });
  }
  return codes;
}
