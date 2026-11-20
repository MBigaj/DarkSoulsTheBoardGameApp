import { describe, expect, it } from 'vitest';
import type { ForgedEncounter } from '../types';
import { matchFixture } from './forge';

const fixture = (id: string, extra: Partial<ForgedEncounter>): ForgedEncounter =>
  ({ id, level: 1, sets: ['sc'], objective: 'slay', tiles: [{}], ...extra }) as ForgedEncounter;

const one = fixture('one', { level: 1, sets: ['sc'] });
const twoTog = fixture('two-tog', {
  level: 2,
  sets: ['tog'],
  objective: 'survive',
  trial: { objective: 'x' },
});
const twoPwa = fixture('two-pwa', {
  level: 2,
  sets: ['pwa'],
  tiles: [{}, {}] as ForgedEncounter['tiles'],
});
const all = [one, twoTog, twoPwa];
const ask = { mode: 'difficulty', partySize: 2 } as const;

describe('matchFixture', () => {
  it('level first, then the sets the player picked', () => {
    expect(matchFixture(all, { ...ask, level: 2, sets: ['pwa'] })?.id).toBe('two-pwa');
    expect(matchFixture(all, { ...ask, level: 2, sets: ['tog'] })?.id).toBe('two-tog');
    expect(matchFixture(all, { ...ask, level: 1, sets: ['pwa'] })?.id).toBe('one');
  });

  it('with no fixture at that level, the nearest level', () => {
    expect(matchFixture([one, twoTog], { ...ask, level: 3, sets: ['sc'] })?.id).toBe('two-tog');
  });

  it('Custom mode prefers the tile count, objective and Trial asked for', () => {
    const custom = { ...ask, mode: 'custom' as const, level: 2 as const, sets: ['sc' as const] };
    expect(matchFixture(all, { ...custom, tiles: 2, objective: 'slay', trial: false })?.id).toBe(
      'two-pwa',
    );
    expect(matchFixture(all, { ...custom, tiles: 1, objective: 'survive', trial: true })?.id).toBe(
      'two-tog',
    );
  });

  it('null with no fixtures', () => {
    expect(matchFixture([], { ...ask, level: 1, sets: ['sc'] })).toBeNull();
  });
});
