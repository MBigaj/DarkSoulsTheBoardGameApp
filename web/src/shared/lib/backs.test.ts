import { describe, expect, it } from 'vitest';
import backs from '@/shared/api/mock/sources/backs';
import { fixtureCards } from '@/test/fixture-cards';
import { backFor } from './backs';

const backOf = (id: string) => {
  const card = fixtureCards.find((c) => c._id === id);
  if (!card) throw new Error(`No fixture ${id}`);
  return backFor(card, backs)?._id;
};

describe('backFor', () => {
  it.each([
    // The most specific entry wins: the class starter back over nothing else matching.
    ['starter kit: its class back', 'tog-treasure-bandit-knife', 'shared-back-starter-thief'],
    ['treasure deck, class card included', 'tog-treasure-archdeacon-robe', 'shared-back-treasure'],
    [
      'boss drop: that boss’s treasure back',
      'tog-treasure-blue-titanite',
      'tog-back-treasure-black-knight',
    ],
    ['enemy: its own back', 'tog-enemy-skeleton-beast', 'tog-back-enemy-skeleton-beast'],
    [
      'boss data card: its behaviour back',
      'tog-boss-gravelord-nito',
      'tog-back-behaviour-gravelord-nito',
    ],
    ['behaviour: its boss’s back', 'tog-behaviour-heavy-slash', 'tog-back-behaviour-black-knight'],
    // Its halves name two bosses, but the card has no `boss` of its own.
    [
      'combined O&S card',
      'sc-behaviour-gliding-stab-hammer-smash',
      'sc-back-behaviour-ornstein-and-smough',
    ],
    ['encounter: its level', 'sc-encounter-dark-alleyway', 'shared-back-encounter-level-1'],
    [
      'boss encounter: the bonfire back',
      'tog-encounter-gravelord-nito',
      'shared-back-encounter-boss',
    ],
    ['event', 'pwa-event-fleeting-glory', 'shared-back-event'],
  ])('%s', (_name, id, back) => {
    expect(backOf(id)).toBe(back);
  });
});
